import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from '@postpilot/nestjs-libraries/database/prisma/notifications/notification.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const mockNotificationService = {
    getMainPageCount: jest.fn(),
    getNotifications: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    controller = module.get(NotificationsController);
  });

  it('calls markAllAsRead with user id on POST /notifications/read', async () => {
    mockNotificationService.markAllAsRead.mockResolvedValue({ success: true });

    const res = await controller.markRead({ id: 'user-7' } as any);

    expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user-7');
    expect(res).toEqual({ success: true });
  });
});
