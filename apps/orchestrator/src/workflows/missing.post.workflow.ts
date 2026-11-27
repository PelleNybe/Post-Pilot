import { continueAsNew, proxyActivities, sleep } from '@temporalio/workflow';
import type { PostActivity } from '@postpilot/orchestrator/activities/post.activity';

const { searchForMissingThreeHoursPosts } = proxyActivities<PostActivity>({
  startToCloseTimeout: '10 minute',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 1,
    initialInterval: '2 minutes',
  },
});

export async function missingPostWorkflow() {
  for (let i = 0; i < 24; i++) {
    await searchForMissingThreeHoursPosts();
    await sleep('1 hour');
  }
  return await continueAsNew<typeof missingPostWorkflow>();
}
