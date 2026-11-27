import { AuthService } from '@postpilot/helpers/auth/auth.service';
import { validateUrlForSSRF } from '@postpilot/helpers/utils/ssrf-validator';
import { LemmySettingsDto } from '@postpilot/nestjs-libraries/dtos/posts/providers-settings/lemmy.dto';
import type {
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@postpilot/nestjs-libraries/integrations/social/social.integrations.interface';
import { SocialAbstract } from '@postpilot/nestjs-libraries/integrations/social.abstract';
import { Tool } from '@postpilot/nestjs-libraries/integrations/tool.decorator';
import { makeId } from '@postpilot/nestjs-libraries/services/make.is';
import type { Integration } from '@prisma/client';
import dayjs from 'dayjs';
import { Logger } from '@nestjs/common';

export class LemmyProvider extends SocialAbstract implements SocialProvider {
  override maxConcurrentJob = 3; // Lemmy instances typically have moderate limits
  identifier = 'lemmy';
  name = 'Lemmy';
  isBetweenSteps = false;
  scopes = [] as string[];
  editor = 'normal' as const;
  maxLength() {
    return 10000;
  }
  dto = LemmySettingsDto;

  async customFields() {
    return [
      {
        key: 'service',
        label: 'Service',
        defaultValue: 'https://lemmy.world',
        validation: `/^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$/`,
        type: 'text' as const,
      },
      {
        key: 'identifier',
        label: 'Identifier',
        validation: `/^.{3,}$/`,
        type: 'text' as const,
      },
      {
        key: 'password',
        label: 'Password',
        validation: `/^.{3,}$/`,
        type: 'password' as const,
      },
    ];
  }

  async refreshToken(_refreshToken: string): Promise<AuthTokenDetails> {
    return {
      refreshToken: '',
      expiresIn: 0,
      accessToken: '',
      id: '',
      name: '',
      picture: '',
      username: '',
    };
  }

  async generateAuthUrl() {
    const state = makeId(6);
    return {
      url: state,
      codeVerifier: makeId(10),
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }) {
    const body = JSON.parse(Buffer.from(params.code, 'base64').toString());

    await validateUrlForSSRF(body.service);
    const load = await this.fetch(`${body.service}/api/v3/user/login`, {
      body: JSON.stringify({
        username_or_email: body.identifier,
        password: body.password,
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (load.status === 401) {
      return 'Invalid credentials';
    }

    const { jwt } = await load.json();

    try {
      await validateUrlForSSRF(body.service);
      const user = await (
        await this.fetch(`${body.service}/api/v3/user?username=${body.identifier}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        })
      ).json();

      return {
        refreshToken: jwt!,
        expiresIn: dayjs().add(100, 'years').unix() - dayjs().unix(),
        accessToken: jwt!,
        id: String(user.person_view.person.id),
        name:
          user.person_view.person.display_name ||
          user.person_view.person.name ||
          '',
        picture: user?.person_view?.person?.avatar || '',
        username: body.identifier || '',
      };
    } catch (e) {
      Logger.log(e);
      return 'Invalid credentials';
    }
  }

  private async getJwtAndService(
    integration: Integration,
  ): Promise<{ jwt: string; service: string }> {
    const body = JSON.parse(
      AuthService.fixedDecryption(integration.customInstanceDetails!),
    );

    await validateUrlForSSRF(body.service);
    const { jwt } = await (
      await this.fetch(`${body.service}/api/v3/user/login`, {
        body: JSON.stringify({
          username_or_email: body.identifier,
          password: body.password,
        }),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ).json();

    return { jwt, service: body.service };
  }

  async post(
    _id: string,
    _accessToken: string,
    postDetails: PostDetails<LemmySettingsDto>[],
    integration: Integration,
  ): Promise<PostResponse[]> {
    const [firstPost] = postDetails;
    const { jwt, service } = await this.getJwtAndService(integration);

    // ⚡ Optimized: Replaced sequential `for...of` fetch loop with parallel `Promise.all`
    const valueArray: PostResponse[] = await Promise.all(
      firstPost.settings.subreddit.map(async (lemmy) => {
        Logger.log({
          community_id: +lemmy.value.id,
          name: lemmy.value.title,
          body: firstPost.message,
          ...(lemmy.value.url ? { url: lemmy.value.url } : {}),
          ...(firstPost.media?.length
            ? { custom_thumbnail: firstPost.media[0].path }
            : {}),
          nsfw: false,
        });
        await validateUrlForSSRF(service);
        const { post_view } = await (
          await this.fetch(`${service}/api/v3/post`, {
            body: JSON.stringify({
              community_id: +lemmy.value.id,
              name: lemmy.value.title,
              body: firstPost.message,
              ...(lemmy.value.url
                ? {
                    url:
                      lemmy.value.url.indexOf('http') === -1
                        ? `https://${lemmy.value.url}`
                        : lemmy.value.url,
                  }
                : {}),
              ...(firstPost.media?.length
                ? { custom_thumbnail: firstPost.media[0].path }
                : {}),
              nsfw: false,
            }),
            method: 'POST',
            headers: {
              Authorization: `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
          })
        ).json();

        return {
          postId: post_view.post.id,
          releaseURL: `${service}/post/${post_view.post.id}`,
          id: firstPost.id,
          status: 'published',
        };
      }),
    );

    return [
      {
        id: firstPost.id,
        postId: valueArray.map((p) => String(p.postId)).join(','),
        releaseURL: valueArray.map((p) => p.releaseURL).join(','),
        status: 'published',
      },
    ];
  }

  async comment(
    _id: string,
    postId: string,
    _lastCommentId: string | undefined,
    _accessToken: string,
    postDetails: PostDetails<LemmySettingsDto>[],
    integration: Integration,
  ): Promise<PostResponse[]> {
    const [commentPost] = postDetails;
    const { jwt, service } = await this.getJwtAndService(integration);

    // postId can be comma-separated if posted to multiple communities
    const postIds = postId.split(',');

    const valueArray: PostResponse[] = await Promise.all(
      postIds.map(async (singlePostId) => {
        await validateUrlForSSRF(service);
        const { comment_view } = await (
          await this.fetch(`${service}/api/v3/comment`, {
            body: JSON.stringify({
              post_id: +singlePostId,
              content: commentPost.message,
            }),
            method: 'POST',
            headers: {
              Authorization: `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
          })
        ).json();

        return {
          postId: String(comment_view.comment.id),
          releaseURL: `${service}/comment/${comment_view.comment.id}`,
          id: commentPost.id,
          status: 'published',
        };
      }),
    );

    return [
      {
        id: commentPost.id,
        postId: valueArray.map((p) => p.postId).join(','),
        releaseURL: valueArray.map((p) => p.releaseURL).join(','),
        status: 'published',
      },
    ];
  }

  @Tool({
    description: 'Search for Lemmy communities by keyword',
    dataSchema: [
      {
        key: 'word',
        type: 'string',
        description: 'Keyword to search for',
      },
    ],
  })
  async subreddits(
    _accessToken: string,
    data: any,
    _id: string,
    integration: Integration,
  ) {
    const { jwt, service } = await this.getJwtAndService(integration);

    await validateUrlForSSRF(service);
    const { communities } = await (
      await this.fetch(
        `${service}/api/v3/search?type_=Communities&sort=Active&q=${data.word}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      )
    ).json();

    return communities.map((p: any) => ({
      title: p.community.title,
      name: p.community.title,
      id: p.community.id,
    }));
  }
}
