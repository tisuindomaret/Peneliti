import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { FilesService } from '../files/files.service';
import { Application, ApplicationStatus } from './entities/application.entity';
import {
  StatusHistory,
  EntityType,
} from '../shared/entities/status-history.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import {
  ApplicationDocument,
  DocumentReviewStatus,
} from './entities/application-document.entity';
import { PermitRequirement } from '../permit-types/entities/permit-requirement.entity';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { User } from '../users/entities/user.entity';
import { extname } from 'path';

const MIME_TYPES_BY_EXTENSION: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
};

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(ApplicationDocument)
    private readonly applicationDocumentRepository: Repository<ApplicationDocument>,
    @InjectRepository(PermitRequirement)
    private readonly permitRequirementRepository: Repository<PermitRequirement>,
    @InjectRepository(StatusHistory)
    private readonly statusHistoryRepository: Repository<StatusHistory>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly auditService: AuditService,
    private readonly filesService: FilesService,
  ) {}

  async findAll(userId: string, userRoles: string[]): Promise<Application[]> {
    if (
      userRoles.includes('admin') ||
      userRoles.includes('official') ||
      userRoles.includes('verifier')
    ) {
      return this.applicationRepository.find({
        order: { updatedAt: 'DESC' },
      });
    }

    return this.applicationRepository.find({
      where: { applicantId: userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    userId: string,
    userRoles: string[],
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({
      where: { id },
      relations: {
        permitType: true,
        institution: true,
        documents: { requirement: true },
      },
    });

    if (!app) throw new NotFoundException('Application not found');

    const isInternal =
      userRoles.includes('admin') ||
      userRoles.includes('official') ||
      userRoles.includes('verifier');

    if (!isInternal && app.applicantId !== userId) {
      throw new ForbiddenException('You can only view your own applications');
    }

    return app;
  }

  async createDraft(
    userId: string,
    dto: CreateApplicationDto,
    user: User,
  ): Promise<Application> {
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Email verification required to create an application draft',
      );
    }

    const app = this.applicationRepository.create({
      permitTypeId: dto.permit_type_id,
      applicantId: userId,
      institutionId: dto.institution_id,
      status: ApplicationStatus.DRAFT,
    });

    const savedApp = await this.applicationRepository.save(app);

    await this.auditService.record({
      actorId: userId,
      action: 'application.draft_created',
      objectType: 'application',
      objectId: savedApp.id,
      afterState: savedApp,
    });

    return savedApp;
  }

  async updateDraft(
    id: string,
    userId: string,
    dto: UpdateApplicationDto,
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    if (app.applicantId !== userId) {
      throw new ForbiddenException('You can only edit your own applications');
    }

    if (
      app.status !== ApplicationStatus.DRAFT &&
      app.status !== ApplicationStatus.NEEDS_REVISION
    ) {
      throw new BadRequestException(
        'Application can only be edited when in draft or needs_revision status',
      );
    }

    const beforeState = { ...app };

    if (dto.title !== undefined) app.title = dto.title;
    if (dto.field_topic !== undefined) app.fieldTopic = dto.field_topic;
    if (dto.location !== undefined) app.location = dto.location;
    if (dto.period_start !== undefined)
      app.periodStart = new Date(dto.period_start);
    if (dto.period_end !== undefined) app.periodEnd = new Date(dto.period_end);
    if (dto.objective !== undefined) app.objective = dto.objective;
    if (dto.method_summary !== undefined)
      app.methodSummary = dto.method_summary;
    if (dto.principal_investigator !== undefined)
      app.principalInvestigator = dto.principal_investigator;
    if (dto.team_members !== undefined) app.teamMembers = dto.team_members;

    const savedApp = await this.applicationRepository.save(app);

    await this.auditService.record({
      actorId: userId,
      action: 'application.draft_updated',
      objectType: 'application',
      objectId: savedApp.id,
      beforeState: beforeState,
      afterState: savedApp,
    });

    return savedApp;
  }

  async uploadDocument(
    id: string,
    userId: string,
    requirementId: string,
    file: Express.Multer.File,
  ): Promise<ApplicationDocument> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    if (app.applicantId !== userId) {
      throw new ForbiddenException(
        'You can only upload documents to your own applications',
      );
    }

    if (
      app.status !== ApplicationStatus.DRAFT &&
      app.status !== ApplicationStatus.NEEDS_REVISION
    ) {
      throw new BadRequestException(
        'Documents can only be uploaded when in draft or needs_revision status',
      );
    }

    const requirement = await this.permitRequirementRepository.findOne({
      where: { id: requirementId },
    });
    if (!requirement)
      throw new NotFoundException('Permit requirement not found');
    if (requirement.permit_type_id !== app.permitTypeId) {
      throw new BadRequestException(
        'Document requirement does not belong to this application permit type',
      );
    }

    if (file.size > requirement.max_size_mb * 1024 * 1024) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${requirement.max_size_mb}MB`,
      );
    }

    const fileExt = extname(file.originalname).slice(1).toLowerCase();
    if (!fileExt || !requirement.accepted_formats.includes(fileExt)) {
      throw new BadRequestException(
        `Invalid file format. Accepted formats: ${requirement.accepted_formats.join(', ')}`,
      );
    }
    if (
      file.mimetype &&
      !MIME_TYPES_BY_EXTENSION[fileExt]?.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        'File MIME type does not match its extension',
      );
    }

    const storagePath = `storage/applications/${id}/${Date.now()}-${file.originalname}`;
    const uploadedFile = await this.filesService.uploadFile(
      userId,
      file,
      storagePath,
    );

    let doc = await this.applicationDocumentRepository.findOne({
      where: { applicationId: id, requirementId },
    });

    if (doc) {
      doc.fileId = uploadedFile.id;
      doc.version += 1;
      doc.reviewStatus = DocumentReviewStatus.PENDING;
    } else {
      doc = this.applicationDocumentRepository.create({
        applicationId: id,
        requirementId,
        fileId: uploadedFile.id,
        version: 1,
        reviewStatus: DocumentReviewStatus.PENDING,
      });
    }

    return this.applicationDocumentRepository.save(doc);
  }

  async getChecklist(
    id: string,
    applicantId?: string,
  ): Promise<Record<string, unknown>> {
    const app = await this.applicationRepository.findOne({
      where: { id },
      relations: { permitType: true },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (applicantId && app.applicantId !== applicantId) {
      throw new ForbiddenException(
        'You can only view your own application checklist',
      );
    }

    const requirements = await this.permitRequirementRepository.find({
      where: { permit_type_id: app.permitTypeId },
    });

    const documents = await this.applicationDocumentRepository.find({
      where: { applicationId: id },
    });

    const checklist = requirements.map((req) => {
      const doc = documents.find((d) => d.requirementId === req.id);
      return {
        requirementId: req.id,
        name: req.name,
        isMandatory: req.is_mandatory,
        status: doc ? doc.reviewStatus : 'missing',
        uploadedFileId: doc ? doc.fileId : null,
      };
    });

    const isComplete = checklist
      .filter((c) => c.isMandatory)
      .every((c) => c.status !== 'missing');

    return {
      applicationId: id,
      isComplete,
      checklist,
    };
  }

  async submitApplication(
    id: string,
    userId: string,
    user?: User,
  ): Promise<Application> {
    if (user && !user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Email verification required to submit an application',
      );
    }

    const app = await this.applicationRepository.findOne({
      where: { id },
      relations: { permitType: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    if (app.applicantId !== userId) {
      throw new ForbiddenException('You can only submit your own applications');
    }

    if (
      app.status !== ApplicationStatus.DRAFT &&
      app.status !== ApplicationStatus.NEEDS_REVISION
    ) {
      throw new BadRequestException(
        'Only draft or needs_revision applications can be submitted',
      );
    }

    const checklistResult = await this.getChecklist(id);
    if (!checklistResult.isComplete) {
      throw new BadRequestException(
        'Checklist incomplete. All mandatory documents must be uploaded.',
      );
    }

    const fromStatus = app.status;
    const beforeState = { ...app };

    app.status = ApplicationStatus.SUBMITTED;
    app.submittedAt = new Date();

    if (!app.applicationNumber) {
      const pattern = app.permitType?.numbering_pattern || 'APP/{YYYY}/{SEQ}';
      const year = new Date().getFullYear();
      const count = await this.applicationRepository.count();
      const seq = String(count + 1).padStart(4, '0');
      app.applicationNumber = pattern
        .replace('{YYYY}', String(year))
        .replace('{SEQ}', seq);
    }

    const savedApp = await this.applicationRepository.save(app);

    const history = this.statusHistoryRepository.create({
      entityType: EntityType.APPLICATION,
      entityId: id,
      fromStatus,
      toStatus: ApplicationStatus.SUBMITTED,
      actorId: userId,
      note: 'Applicant submitted application',
    });
    await this.statusHistoryRepository.save(history);

    await this.auditService.record({
      actorId: userId,
      action: 'application.submitted',
      objectType: 'application',
      objectId: savedApp.id,
      beforeState: beforeState,
      afterState: savedApp,
    });

    return savedApp;
  }
}
