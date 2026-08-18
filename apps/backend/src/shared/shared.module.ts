import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusHistory } from './entities/status-history.entity';
import { StatusTransitionService } from './services/status-transition.service';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([StatusHistory]), AuditModule],
  providers: [StatusTransitionService],
  exports: [StatusTransitionService],
})
export class SharedModule {}
