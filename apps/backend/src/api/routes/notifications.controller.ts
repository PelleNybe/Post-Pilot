import { Controller, Get, Post } from '@nestjs/common';
import { GetUserFromRequest } from '@postpilot/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { GetOrgFromRequest } from '@postpilot/nestjs-libraries/user/org.from.request';
import { NotificationService } from '@postpilot/nestjs-libraries/database/prisma/notifications/notification.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('/notifications')
export class NotificationsController {
  constructor(private _notificationsService: NotificationService) {}
  @Get('/')
  async mainPageList(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() organization: Organization
  ) {
    return this._notificationsService.getMainPageCount(
      organization.id,
      user.id
    );
  }

  @Get('/list')
  async notifications(
    @GetUserFromRequest() user: User,
    @GetOrgFromRequest() organization: Organization
  ) {
    return this._notificationsService.getNotifications(
      organization.id,
      user.id
    );
  }

  @Post('/read')
  async markRead(@GetUserFromRequest() user: User) {
    return this._notificationsService.markAllAsRead(user.id);
  }
}
