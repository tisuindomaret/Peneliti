import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermitTypesService } from './permit-types.service';
import {
  PermitTypesController,
  PermitRequirementsController,
} from './permit-types.controller';
import { PermitType } from './entities/permit-type.entity';
import { PermitRequirement } from './entities/permit-requirement.entity';
import { DocumentTemplate } from './entities/document-template.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PermitType, PermitRequirement, DocumentTemplate]),
    AuditModule,
  ],
  controllers: [PermitTypesController, PermitRequirementsController],
  providers: [PermitTypesService],
  exports: [PermitTypesService],
})
export class PermitTypesModule {}
