import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import {
  Notification,
  DeliveryStatus,
  NotificationChannel,
} from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Logger } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotificationRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTemplateRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepo,
        },
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: mockTemplateRepo,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    // Suppress logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('queueNotification', () => {
    it('should create a notification and add it to the queue', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);
      mockNotificationRepo.create.mockReturnValue({
        id: 'n1',
        deliveryStatus: DeliveryStatus.PENDING,
      });
      mockNotificationRepo.save.mockResolvedValue({
        id: 'n1',
        deliveryStatus: DeliveryStatus.PENDING,
      });
      mockQueue.add.mockResolvedValue(true);

      const result = await service.queueNotification({
        recipientId: 'u1',
        channel: NotificationChannel.EMAIL,
        eventType: 'test_event',
        variables: {},
      });

      expect(result.id).toBe('n1');
      expect(mockQueue.add).toHaveBeenCalled();
      expect(mockNotificationRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update status to FAILED and increment retryCount', async () => {
      const mockNotif = {
        id: 'n1',
        deliveryStatus: DeliveryStatus.PENDING,
        retryCount: 0,
      };
      mockNotificationRepo.findOne.mockResolvedValue(mockNotif);
      mockNotificationRepo.save.mockResolvedValue({
        ...mockNotif,
        deliveryStatus: DeliveryStatus.FAILED,
        retryCount: 1,
      });

      await service.updateDeliveryStatus(
        'n1',
        DeliveryStatus.FAILED,
        new Error('Test error'),
      );

      expect(mockNotificationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryStatus: DeliveryStatus.FAILED,
          retryCount: 1,
        }),
      );
    });
  });

  describe('retryFailedNotification', () => {
    it('should return false if notification not found or not failed', async () => {
      mockNotificationRepo.findOne.mockResolvedValue({
        id: 'n1',
        deliveryStatus: DeliveryStatus.SENT,
      });
      const result = await service.retryFailedNotification('n1');
      expect(result).toBe(false);
    });

    it('should requeue and return true if failed', async () => {
      const mockNotif = {
        id: 'n1',
        deliveryStatus: DeliveryStatus.FAILED,
        eventType: 'test',
        content: 'test',
        recipientId: 'u1',
        channel: 'email',
      };
      mockNotificationRepo.findOne.mockResolvedValue(mockNotif);
      mockTemplateRepo.findOne.mockResolvedValue(null);
      mockNotificationRepo.save.mockResolvedValue(mockNotif);

      const result = await service.retryFailedNotification('n1');

      expect(result).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-notification',
        expect.any(Object),
        expect.any(Object),
      );
      expect(mockNotif.deliveryStatus).toBe(DeliveryStatus.PENDING);
    });
  });
});
