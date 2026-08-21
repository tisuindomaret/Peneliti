import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { UpdateNotificationTemplateDto } from './dto/update-template.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  async findAll(@Req() req: RequestWithUser) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Patch('notifications/:id/read')
  async markAsRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    const notification = await this.notificationsService.findOne(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.recipientId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }

    return this.notificationsService.markAsRead(id);
  }

  @Get('admin/notifications/failed')
  @Roles('admin')
  async getFailedNotifications() {
    return this.notificationsService.getFailedNotifications();
  }

  @Post('admin/notifications/:id/retry')
  @Roles('admin')
  async retryFailedNotification(@Param('id') id: string) {
    const result = await this.notificationsService.retryFailedNotification(id);
    if (!result) {
      throw new NotFoundException(
        'Notification not found or not in failed state',
      );
    }
    return { message: 'Notification queued for retry successfully' };
  }

  @Put('admin/notification-templates/:event')
  @Roles('admin')
  async updateTemplate(
    @Param('event') event: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.notificationsService.updateTemplate(event, dto);
  }
}
