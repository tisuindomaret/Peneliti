import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { PermitTypesModule } from '../permit-types/permit-types.module';
import { Application } from './entities/application.entity';
import { ApplicationDocument } from './entities/application-document.entity';
import { StatusHistory } from '../shared/entities/status-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, ApplicationDocument, StatusHistory]),
    AuditModule,
    FilesModule,
    PermitTypesModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
