import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  Notification,
  NotificationChannel,
  DeliveryStatus,
} from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { UpdateNotificationTemplateDto } from './dto/update-template.dto';

export interface NotificationPayload {
  recipientId: string;
  channel: NotificationChannel;
  eventType: string;
  variables: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async queueNotification(payload: NotificationPayload): Promise<Notification> {
    const template = await this.templateRepo.findOne({
      where: { eventType: payload.eventType },
    });

    let content = '';
    let subject = '';

    if (template) {
      content = template.bodyTemplate;
      subject = template.subject;
      if (payload.variables) {
        for (const [key, value] of Object.entries(payload.variables)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
          subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
      }
    } else {
      content = `Event: ${payload.eventType}. Variables: ${JSON.stringify(
        payload.variables,
      )}`;
      subject = `Notification: ${payload.eventType}`;
    }

    const notification = this.notificationRepo.create({
      recipientId: payload.recipientId,
      channel: payload.channel,
      eventType: payload.eventType,
      content,
      deliveryStatus: DeliveryStatus.PENDING,
    });

    const saved = await this.notificationRepo.save(notification);

    await this.notificationsQueue.add(
      'send-notification',
      {
        notificationId: saved.id,
        recipientId: payload.recipientId,
        channel: payload.channel,
        subject,
        content,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(
      `Queued notification ${saved.id} for event ${payload.eventType}`,
    );
    return saved;
  }

  async updateDeliveryStatus(
    id: string,
    status: DeliveryStatus,
    error?: Error,
  ): Promise<void> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (notification) {
      notification.deliveryStatus = status;
      if (status === DeliveryStatus.SENT) {
        notification.sentAt = new Date();
      } else if (status === DeliveryStatus.FAILED) {
        notification.retryCount += 1;
        this.logger.error(
          `Notification ${id} delivery failed: ${error?.message}`,
        );
      }
      await this.notificationRepo.save(notification);
    }
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { recipientId: userId, channel: NotificationChannel.IN_APP },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification | null> {
    return this.notificationRepo.findOne({ where: { id } });
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new Error(`Notification not found: ${id}`);
    }
    notification.deliveryStatus = DeliveryStatus.READ;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async getFailedNotifications(): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { deliveryStatus: DeliveryStatus.FAILED },
      order: { createdAt: 'DESC' },
    });
  }

  async retryFailedNotification(id: string): Promise<boolean> {
    const notification = await this.findOne(id);
    if (
      !notification ||
      notification.deliveryStatus !== DeliveryStatus.FAILED
    ) {
      return false;
    }

    notification.deliveryStatus = DeliveryStatus.PENDING;
    await this.notificationRepo.save(notification);

    let subject = `Retry Notification: ${notification.eventType}`;
    const content = notification.content;

    const template = await this.templateRepo.findOne({
      where: { eventType: notification.eventType },
    });

    if (template) {
      subject = template.subject;
    }

    await this.notificationsQueue.add(
      'send-notification',
      {
        notificationId: notification.id,
        recipientId: notification.recipientId,
        channel: notification.channel,
        subject,
        content,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return true;
  }

  async updateTemplate(
    eventType: string,
    dto: UpdateNotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    let template = await this.templateRepo.findOne({ where: { eventType } });
    if (!template) {
      template = this.templateRepo.create({ eventType });
    }

    if (dto.subject !== undefined) template.subject = dto.subject;
    if (dto.bodyTemplate !== undefined)
      template.bodyTemplate = dto.bodyTemplate;
    if (dto.internalRecipients !== undefined)
      template.internalRecipients = dto.internalRecipients;

    return this.templateRepo.save(template);
  }
}
