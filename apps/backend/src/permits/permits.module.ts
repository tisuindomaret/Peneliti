import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermitsController } from './permits.controller';
import { VerificationController } from './verification.controller';
import { PermitsService } from './permits.service';
import { Permit } from './entities/permit.entity';
import { ApplicationsModule } from '../applications/applications.module';
import { FilesModule } from '../files/files.module';
import { AuditModule } from '../audit/audit.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permit]),
    forwardRef(() => ApplicationsModule),
    FilesModule,
    AuditModule,
    SharedModule,
  ],
  controllers: [PermitsController, VerificationController],
  providers: [PermitsService],
  exports: [PermitsService],
})
export class PermitsModule {}
