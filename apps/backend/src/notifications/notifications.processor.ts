import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailerService } from '../mailer/mailer.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from './notifications.service';
import {
  NotificationChannel,
  DeliveryStatus,
} from './entities/notification.entity';

export interface SendNotificationJobData {
  notificationId: string;
  recipientId: string;
  channel: NotificationChannel;
  subject: string;
  content: string;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<SendNotificationJobData, any, string>): Promise<any> {
    const { notificationId, recipientId, channel, subject, content } = job.data;

    if (channel === NotificationChannel.IN_APP) {
      await this.notificationsService.updateDeliveryStatus(
        notificationId,
        DeliveryStatus.SENT,
      );
      return { success: true, channel };
    }

    if (channel === NotificationChannel.EMAIL) {
      const user = await this.usersService.findById(recipientId);
      if (!user) {
        throw new Error(`User not found: ${recipientId}`);
      }

      await this.mailerService.sendGenericEmail(user.email, subject, content);

      await this.notificationsService.updateDeliveryStatus(
        notificationId,
        DeliveryStatus.SENT,
      );
      return { success: true, channel };
    }

    throw new Error(`Unsupported channel: ${String(channel)}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<SendNotificationJobData>, error: Error) {
    this.logger.error(
      `Job failed for notification ${job.data.notificationId}: ${error.message}`,
      error.stack,
    );
    await this.notificationsService.updateDeliveryStatus(
      job.data.notificationId,
      DeliveryStatus.FAILED,
      error,
    );
  }
}
