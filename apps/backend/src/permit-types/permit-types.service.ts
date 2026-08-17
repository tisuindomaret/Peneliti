import {
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermitType } from './entities/permit-type.entity';
import { PermitRequirement } from './entities/permit-requirement.entity';
import { DocumentTemplate } from './entities/document-template.entity';
import { CreatePermitTypeDto } from './dto/create-permit-type.dto';
import { UpdatePermitTypeDto } from './dto/update-permit-type.dto';
import { CreatePermitRequirementDto } from './dto/create-permit-requirement.dto';
import { UpdatePermitRequirementDto } from './dto/update-permit-requirement.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PermitTypesService implements OnModuleInit {
  private readonly logger = new Logger(PermitTypesService.name);

  constructor(
    @InjectRepository(PermitType)
    private readonly permitTypeRepository: Repository<PermitType>,
    @InjectRepository(PermitRequirement)
    private readonly permitRequirementRepository: Repository<PermitRequirement>,
    @InjectRepository(DocumentTemplate)
    private readonly documentTemplateRepository: Repository<DocumentTemplate>,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    this.logger.log('Checking and seeding default permit types...');

    let demoTemplate = await this.documentTemplateRepository.findOne({
      where: { name: 'Demo Template' },
    });
    if (!demoTemplate) {
      demoTemplate = this.documentTemplateRepository.create({
        name: 'Demo Template',
      });
      demoTemplate = await this.documentTemplateRepository.save(demoTemplate);
      this.logger.log('Seeded Demo Template');
    }

    let demoType = await this.permitTypeRepository.findOne({
      where: { name: 'Demo Research Permit' },
    });
    if (!demoType) {
      demoType = this.permitTypeRepository.create({
        name: 'Demo Research Permit',
        description: 'A sample permit type for development and testing.',
        is_active: true,
        validity_period_days: 365,
        numbering_pattern: 'DEMO/RES/{YYYY}/{SEQ}',
        pdf_template_id: demoTemplate.id,
      });
      demoType = await this.permitTypeRepository.save(demoType);
      this.logger.log('Seeded Demo Research Permit Type');

      const demoRequirement = this.permitRequirementRepository.create({
        permit_type_id: demoType.id,
        name: 'Research Proposal',
        is_mandatory: true,
        accepted_formats: ['pdf', 'docx'],
        max_size_mb: 5,
      });
      await this.permitRequirementRepository.save(demoRequirement);
      this.logger.log('Seeded Demo Research Requirement');
    }
  }

  async findAll(isAdmin: boolean = false): Promise<PermitType[]> {
    const whereClause = isAdmin ? {} : { is_active: true };
    return this.permitTypeRepository.find({
      where: whereClause,
      relations: { requirements: true, pdf_template: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PermitType> {
    const permitType = await this.permitTypeRepository.findOne({
      where: { id },
      relations: { requirements: true, pdf_template: true },
    });

    if (!permitType) {
      throw new NotFoundException(`PermitType with ID ${id} not found`);
    }

    return permitType;
  }

  async create(
    createDto: CreatePermitTypeDto,
    actorId: string,
  ): Promise<PermitType> {
    const permitType = this.permitTypeRepository.create(createDto);
    const saved = await this.permitTypeRepository.save(permitType);

    await this.auditService.record({
      action: 'permit_type.created',
      objectType: 'permit_type',
      objectId: saved.id,
      actorId: actorId,
      afterState: saved,
    });

    return saved;
  }

  async update(
    id: string,
    updateDto: UpdatePermitTypeDto,
    actorId: string,
  ): Promise<PermitType> {
    const permitType = await this.findOne(id);
    const beforeState = { ...permitType };

    const updated = await this.permitTypeRepository.save({
      ...permitType,
      ...updateDto,
    });

    await this.auditService.record({
      action: 'permit_type.updated',
      objectType: 'permit_type',
      objectId: id,
      actorId: actorId,
      beforeState,
      afterState: updated,
    });

    return updated;
  }

  async toggleActive(
    id: string,
    isActive: boolean,
    actorId: string,
  ): Promise<PermitType> {
    const permitType = await this.findOne(id);
    const beforeState = { ...permitType };

    permitType.is_active = isActive;
    const updated = await this.permitTypeRepository.save(permitType);

    await this.auditService.record({
      action: isActive ? 'permit_type.activated' : 'permit_type.deactivated',
      objectType: 'permit_type',
      objectId: id,
      actorId: actorId,
      beforeState,
      afterState: updated,
    });

    return updated;
  }

  async addRequirement(
    permitTypeId: string,
    createDto: CreatePermitRequirementDto,
    actorId: string,
  ): Promise<PermitRequirement> {
    const requirement = this.permitRequirementRepository.create({
      ...createDto,
      permit_type_id: permitTypeId,
    });

    const saved = await this.permitRequirementRepository.save(requirement);

    await this.auditService.record({
      action: 'permit_requirement.created',
      objectType: 'permit_requirement',
      objectId: saved.id,
      actorId: actorId,
      afterState: saved,
    });

    return saved;
  }

  async updateRequirement(
    id: string,
    updateDto: UpdatePermitRequirementDto,
    actorId: string,
  ): Promise<PermitRequirement> {
    const requirement = await this.permitRequirementRepository.findOne({
      where: { id },
    });
    if (!requirement) {
      throw new NotFoundException(`PermitRequirement with ID ${id} not found`);
    }

    const beforeState = { ...requirement };

    const updated = await this.permitRequirementRepository.save({
      ...requirement,
      ...updateDto,
    });

    await this.auditService.record({
      action: 'permit_requirement.updated',
      objectType: 'permit_requirement',
      objectId: id,
      actorId: actorId,
      beforeState,
      afterState: updated,
    });

    return updated;
  }
}
