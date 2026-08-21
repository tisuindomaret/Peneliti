import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}
import { DeliveryStatus } from './entities/notification.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockService = {
    getUserNotifications: jest.fn(),
    findOne: jest.fn(),
    markAsRead: jest.fn(),
    getFailedNotifications: jest.fn(),
    retryFailedNotification: jest.fn(),
    updateTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [{ id: '1', content: 'test' }];
      mockService.getUserNotifications.mockResolvedValue(mockNotifications);

      const req = { user: { id: 'user-1' } } as unknown as RequestWithUser;
      const result = await controller.findAll(req);

      expect(result).toEqual(mockNotifications);
      expect(mockService.getUserNotifications).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification does not exist', async () => {
      mockService.findOne.mockResolvedValue(null);
      const req = { user: { id: 'user-1' } } as unknown as RequestWithUser;

      await expect(controller.markAsRead('1', req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the recipient', async () => {
      mockService.findOne.mockResolvedValue({ id: '1', recipientId: 'user-2' });
      const req = { user: { id: 'user-1' } } as unknown as RequestWithUser;

      await expect(controller.markAsRead('1', req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should mark notification as read and return it', async () => {
      const mockNotif = {
        id: '1',
        recipientId: 'user-1',
        deliveryStatus: DeliveryStatus.SENT,
      };
      mockService.findOne.mockResolvedValue(mockNotif);
      mockService.markAsRead.mockResolvedValue({
        ...mockNotif,
        deliveryStatus: DeliveryStatus.READ,
      });

      const req = { user: { id: 'user-1' } } as unknown as RequestWithUser;
      const result = await controller.markAsRead('1', req);

      expect(result.deliveryStatus).toBe(DeliveryStatus.READ);
      expect(mockService.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  describe('getFailedNotifications', () => {
    it('should return failed notifications for admin', async () => {
      const failed = [{ id: '1', deliveryStatus: DeliveryStatus.FAILED }];
      mockService.getFailedNotifications.mockResolvedValue(failed);

      const result = await controller.getFailedNotifications();
      expect(result).toEqual(failed);
    });
  });

  describe('retryFailedNotification', () => {
    it('should throw NotFoundException if not found or not failed', async () => {
      mockService.retryFailedNotification.mockResolvedValue(false);
      await expect(controller.retryFailedNotification('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return success message if retried successfully', async () => {
      mockService.retryFailedNotification.mockResolvedValue(true);
      const result = await controller.retryFailedNotification('1');
      expect(result).toEqual({
        message: 'Notification queued for retry successfully',
      });
    });
  });
});
