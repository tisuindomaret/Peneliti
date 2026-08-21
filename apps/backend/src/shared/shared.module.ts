import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusHistory } from './entities/status-history.entity';
import { StatusTransitionService } from './services/status-transition.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([StatusHistory]),
    AuditModule,
    NotificationsModule,
  ],
  providers: [StatusTransitionService],
  exports: [StatusTransitionService],
})
export class SharedModule {}
