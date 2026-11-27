import type { PostResponse } from '@postpilot/nestjs-libraries/integrations/social/social.integrations.interface';
import { postId as postIdSearchParam } from '@postpilot/nestjs-libraries/temporal/temporal.search.attribute';
import type { PostActivity } from '@postpilot/orchestrator/activities/post.activity';
import type { Integration } from '@prisma/client';
import { TypedSearchAttributes } from '@temporalio/common';
import {
  ActivityFailure,
  ApplicationFailure,
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
  sleep,
  startChild,
  uuid4,
} from '@temporalio/workflow';
import dayjs from 'dayjs';
import { capitalize, sortBy } from 'lodash';

const proxyTaskQueue = (taskQueue: string) => {
  return proxyActivities<PostActivity>({
    startToCloseTimeout: '10 minute',
    taskQueue,
    retry: {
      maximumAttempts: 3,
      backoffCoefficient: 1,
      initialInterval: '2 minutes',
    },
  });
};

const {
  getPostsList,
  inAppNotification,
  changeState,
  updatePost,
  sendWebhooks,
  isCommentable,
} = proxyActivities<PostActivity>({
  startToCloseTimeout: '10 minute',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 1,
    initialInterval: '2 minutes',
  },
});

const poke = defineSignal('poke');

const iterate = Array.from({ length: 5 });

export async function postWorkflowV101({
  taskQueue,
  postId,
  organizationId,
  postNow = false,
}: {
  taskQueue: string;
  postId: string;
  organizationId: string;
  postNow?: boolean;
}) {
  // Dynamic task queue, for concurrency
  const {
    postSocial,
    postComment,
    getIntegrationById,
    refreshToken,
    internalPlugs,
    globalPlugs,
    processInternalPlug,
    processPlug,
  } = proxyTaskQueue(taskQueue);

  let _poked = false;
  setHandler(poke, () => {
    _poked = true;
  });

  const startTime = new Date();
  // get all the posts and comments to post
  const postsListBefore = await getPostsList(organizationId, postId);
  const [post] = postsListBefore;

  // in case doesn't exists for some reason, fail it
  if (!post || (!postNow && post.state !== 'QUEUE')) {
    return;
  }

  // if it's a repeatable post, we should ignore this.
  if (!postNow) {
    const delayMs = dayjs(post.publishDate).isBefore(dayjs())
      ? 0
      : dayjs(post.publishDate).diff(dayjs(), 'millisecond');
    if (delayMs > 0) {
      await condition(() => _poked, delayMs);
    }
  }

  // if refresh is needed from last time, let's inform the user
  if (post.integration?.refreshNeeded) {
    await inAppNotification(
      post.organizationId,
      `We couldn't post to ${post.integration?.providerIdentifier} for ${post?.integration?.name}`,
      `We couldn't post to ${post.integration?.providerIdentifier} for ${post?.integration?.name} because you need to reconnect it. Please enable it and try again.`,
      true,
      false,
      'info',
    );
    return;
  }

  // if it's disabled, inform the user
  if (post.integration?.disabled) {
    await inAppNotification(
      post.organizationId,
      `We couldn't post to ${post.integration?.providerIdentifier} for ${post?.integration?.name}`,
      `We couldn't post to ${post.integration?.providerIdentifier} for ${post?.integration?.name} because it's disabled. Please enable it and try again.`,
      true,
      false,
      'info',
    );
    return;
  }

  // Do we need to post comment for this social?
  const toComment: boolean =
    postsListBefore.length === 1
      ? false
      : await isCommentable(post.integration);

  const postsList = toComment ? postsListBefore : [postsListBefore[0]];

  // list of all the saved results
  const postsResults: PostResponse[] = [];

  // iterate over the posts
  for (let i = 0; i < postsList.length; i++) {
    const before = postsResults.length;
    let lastErr: unknown = null;
    // this is a small trick to repeat an action in case of token refresh
    for (const _ of iterate) {
      try {
        // first post the main post
        if (i === 0) {
          postsResults.push(
            ...(await postSocial(post.integration as Integration, [
              postsList[i],
            ])),
          );

          // then post the comments if any
        } else {
          if (postsList[i].delay) {
            await sleep(60000 * Math.max(0, Number(postsList[i].delay ?? 0)));
          }

          postsResults.push(
            ...(await postComment(
              postsResults[0].postId,
              postsResults.length === 1
                ? undefined
                : postsResults[i - 1].postId,
              post.integration,
              [postsList[i]],
            )),
          );
        }

        // mark post as successful
        await updatePost(
          postsList[i].id,
          postsResults[i].postId,
          postsResults[i].releaseURL,
        );

        if (i === 0) {
          // send notification on a sucessful post
          await inAppNotification(
            post.integration.organizationId,
            `Your post has been published on ${capitalize(
              post.integration.providerIdentifier,
            )}`,
            `Your post has been published on ${capitalize(
              post.integration.providerIdentifier,
            )} at ${postsResults[0].releaseURL}`,
            true,
            true,
          );
        }

        // break the current while to move to the next post
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        // if token refresh is needed, do it and repeat
        if (
          err instanceof ActivityFailure &&
          err.cause instanceof ApplicationFailure &&
          err.cause.type === 'refresh_token'
        ) {
          const refresh = await refreshToken(post.integration);
          if (!refresh || !refresh.accessToken) {
            await changeState(postsList[0].id, 'ERROR', err, postsList);
            return false;
          }

          post.integration.token = refresh.accessToken;
          continue;
        }

        // specific case for bad body errors (non-retryable)
        if (
          err instanceof ActivityFailure &&
          err.cause instanceof ApplicationFailure &&
          err.cause.type === 'bad_body'
        ) {
          await changeState(postsList[0].id, 'ERROR', err, postsList);
          await inAppNotification(
            post.organizationId,
            `Error posting${i === 0 ? ' ' : ' comments '}on ${
              post.integration?.providerIdentifier
            } for ${post?.integration?.name}`,
            `An error occurred while posting${i === 0 ? ' ' : ' comments '}on ${
              post.integration?.providerIdentifier
            }${err?.cause?.message ? `: ${err?.cause?.message}` : ``}`,
            true,
            false,
            'fail',
          );
          return false;
        }
      }
    }

    if (postsResults.length === before) {
      // all retries exhausted without success
      await changeState(postsList[0].id, 'ERROR', lastErr, postsList);
      return false;
    }
  }

  // send webhooks for the post
  await sendWebhooks(
    postsResults[0].postId,
    post.organizationId,
    post.integration.id,
  );

  let parsedSettings: Record<string, any> = {};
  try {
    parsedSettings = post.settings ? JSON.parse(post.settings) : {};
  } catch {
    parsedSettings = {};
  }

  // load internal plugs like repost by other users
  const [internalPlugsListRaw, globalPlugsListRaw] = await Promise.all([
    internalPlugs(post.integration, parsedSettings),
    globalPlugs(post.integration),
  ]);
  const internalPlugsList = internalPlugsListRaw;

  // load global plugs, like repost a post if it gets to a certain number of likes
  const globalPlugsList = globalPlugsListRaw.reduce((all, current) => {
    for (let i = 1; i <= current.totalRuns; i++) {
      all.push({
        ...current,
        delay: current.delay * i,
      });
    }

    return all;
  }, []);

  // Check if the post is repeatable
  const repeatPost = !post.intervalInDays
    ? []
    : [
        {
          type: 'repeat-post',
          delay:
            post.intervalInDays * 24 * 60 * 60 * 1000 -
            (Date.now() - startTime.getTime()),
        },
      ];

  // Sort all the actions by delay, so we can process them in order
  const list = sortBy(
    [...internalPlugsList, ...globalPlugsList, ...repeatPost],
    'delay',
  );

  // process all the plugs in order, we are using while because in some cases we need to remove items from the list
  const cancelledPlugs = new Set<string>();

  await Promise.all(
    list.map(async (actionItem) => {
      // wait for the delay
      await sleep(Math.max(0, Number(actionItem.delay ?? 0)));

      if (cancelledPlugs.has(actionItem.plugId)) {
        return;
      }

      // process internal plug
      if (actionItem.type === 'internal-plug') {
        for (const _ of iterate) {
          try {
            await processInternalPlug({
              ...actionItem,
              post: postsResults[0].postId,
            });
          } catch (err) {
            if (
              err instanceof ActivityFailure &&
              err.cause instanceof ApplicationFailure &&
              err.cause.type === 'refresh_token'
            ) {
              const refresh = await refreshToken(
                await getIntegrationById(
                  organizationId,
                  actionItem.integration,
                ),
              );
              if (!refresh || !refresh.accessToken) {
                break;
              }
              continue;
            }
            if (
              err instanceof ActivityFailure &&
              err.cause instanceof ApplicationFailure &&
              err.cause.type === 'bad_body'
            ) {
              break;
            }
            continue;
          }
          break;
        }
      }

      // process global plug
      if (actionItem.type === 'global') {
        for (const _ of iterate) {
          try {
            const process = await processPlug({
              ...actionItem,
              postId: postsResults[0].postId,
            });
            if (process) {
              cancelledPlugs.add(actionItem.plugId);
            }
          } catch (err) {
            if (
              err instanceof ActivityFailure &&
              err.cause instanceof ApplicationFailure &&
              err.cause.type === 'refresh_token'
            ) {
              const refresh = await refreshToken(post.integration);
              if (!refresh || !refresh.accessToken) {
                break;
              }
              continue;
            }
            if (
              err instanceof ActivityFailure &&
              err.cause instanceof ApplicationFailure &&
              err.cause.type === 'bad_body'
            ) {
              break;
            }
            continue;
          }
          break;
        }
      }

      // process repeat post in a new workflow, this is important so the other plugs can keep running
      if (actionItem.type === 'repeat-post') {
        await startChild(postWorkflowV101, {
          parentClosePolicy: 'ABANDON',
          args: [
            {
              taskQueue,
              postId,
              organizationId,
              postNow: true,
            },
          ],
          workflowId: `post_${post.id}_${uuid4().slice(0, 10)}`,
          typedSearchAttributes: new TypedSearchAttributes([
            {
              key: postIdSearchParam,
              value: postId,
            },
          ]),
        });
      }
    }),
  );
}
