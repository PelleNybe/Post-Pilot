import { proxyActivities, sleep } from '@temporalio/workflow';
import type { EmailActivity } from '@postpilot/orchestrator/activities/email.activity';

const { sendEmailAsync, getUserOrgs, setStreak } =
  proxyActivities<EmailActivity>({
    startToCloseTimeout: '10 minute',
    taskQueue: 'main',
    cancellationType: 'ABANDON',
  });

export async function streakWorkflow({
  organizationId,
}: {
  organizationId: string;
}) {
  await setStreak(organizationId, 'start');
  await sleep(79200000);
  const userOrgs = await getUserOrgs(organizationId);
  await Promise.all(
    userOrgs.users
      .filter((user) => user.user.sendStreakEmails)
      .map((user) =>
        sendEmailAsync(
          user.user.email,
          'Streak Reminder',
          '<p>You are about to lose your streak in two hours! schedule a post now to keep it!</p>',
          'bottom',
        ),
      ),
  );
  await sleep(7200000);
  await setStreak(organizationId, 'end');
}
