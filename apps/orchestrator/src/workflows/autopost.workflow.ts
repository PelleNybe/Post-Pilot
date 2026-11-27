import { continueAsNew, proxyActivities, sleep } from '@temporalio/workflow';
import type { AutopostActivity } from '@postpilot/orchestrator/activities/autopost.activity';

const { autoPost } = proxyActivities<AutopostActivity>({
  startToCloseTimeout: '10 minute',
  taskQueue: 'main',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 1,
    initialInterval: '2 minutes',
  },
});

export async function autoPostWorkflow({
  id,
  immediately,
}: {
  id: string;
  immediately: boolean;
}) {
  try {
    if (immediately) {
      await autoPost(id);
    }
  } catch (err) {}
  await sleep(3600000);
  return await continueAsNew<typeof autoPostWorkflow>({
    id,
    immediately: true,
  });
}
