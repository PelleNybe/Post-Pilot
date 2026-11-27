import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '@postpilot/nestjs-libraries/database/prisma/notifications/notifications.repository';
import { EmailService } from '@postpilot/nestjs-libraries/services/email.service';
import { OrganizationRepository } from '@postpilot/nestjs-libraries/database/prisma/organizations/organization.repository';
import { TemporalService } from 'nestjs-temporal-core';
import { TypedSearchAttributes } from '@temporalio/common';
import { organizationId } from '@postpilot/nestjs-libraries/temporal/temporal.search.attribute';

export type NotificationType = 'success' | 'fail' | 'info';

@Injectable()
export class NotificationService {
  constructor(
    private _notificationRepository: NotificationsRepository,
    private _emailService: EmailService,
    private _organizationRepository: OrganizationRepository,
    private _temporalService: TemporalService
  ) {}

  getMainPageCount(organizationId: string, userId: string) {
    return this._notificationRepository.getMainPageCount(
      organizationId,
      userId
    );
  }

  getNotificationsPaginated(organizationId: string, page: number) {
    return this._notificationRepository.getNotificationsPaginated(
      organizationId,
      page
    );
  }

  getNotifications(organizationId: string, userId: string) {
    return this._notificationRepository.getNotifications(
      organizationId,
      userId
    );
  }

  markAllAsRead(userId: string) {
    return this._notificationRepository.markAllAsRead(userId);
  }

  async inAppNotification(
    orgId: string,
    subject: string,
    message: string,
    sendEmail = false,
    digest = false,
    type: NotificationType = 'success'
  ) {
    await this._notificationRepository.createNotification(orgId, message);
    if (!sendEmail) {
      return;
    }

    if (digest) {
      try {
        await this._temporalService.client
          .getRawClient()
          ?.workflow.signalWithStart('digestEmailWorkflow', {
            workflowId: 'digest_email_workflow_' + orgId,
            signal: 'email',
            signalArgs: [
              [
                {
                  title: subject,
                  message,
                  type,
                },
              ],
            ],
            taskQueue: 'main',
            workflowIdConflictPolicy: 'USE_EXISTING',
            args: [{ organizationId: orgId }],
            typedSearchAttributes: new TypedSearchAttributes([
              {
                key: organizationId,
                value: orgId,
              },
            ]),
          });
      } catch (err) {}

      return;
    }

    await this.sendEmailsToOrg(orgId, subject, message, type);
  }

  async sendEmailsToOrg(
    orgId: string,
    subject: string,
    message: string,
    type?: NotificationType
  ) {
    const userOrg = await this._organizationRepository.getAllUsersOrgs(orgId);
    // ⚡ Bolt: Replaced sequential for...of loop with Promise.all and map to parallelize I/O-bound email dispatching
    // Impact: Avoids blocking the main thread and significantly speeds up notification broadcasting for organizations with multiple users
    await Promise.all(
      (userOrg?.users || []).map(async (user) => {
        // 'info' type is always sent regardless of preferences
        if (type !== 'info') {
          // Filter users based on their email preferences
          if (type === 'success' && !user.user.sendSuccessEmails) {
            return;
          }
          if (type === 'fail' && !user.user.sendFailureEmails) {
            return;
          }
        }
        await this.sendEmail(user.user.email, subject, message);
      })
    );
  }

  async sendEmail(to: string, subject: string, html: string, replyTo?: string) {
    await this._emailService.sendEmail(to, subject, html, 'top', replyTo);
  }

  hasEmailProvider() {
    return this._emailService.hasProvider();
  }
}
