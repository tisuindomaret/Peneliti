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
import { StatusTransitionService } from '../shared/services/status-transition.service';
import { ReviewApplicationDto } from './dto/review-application.dto';
import {
  RequestRevisionDto,
  ForwardApplicationDto,
  ApproveApplicationDto,
  RejectApplicationDto,
} from './dto/review-action.dto';
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
    private readonly statusTransitionService: StatusTransitionService,
  ) {}

  async findAll(
    userId: string,
    userRoles: string[],

    query: Record<string, any> = {},
  ): Promise<Application[]> {
    const isInternal =
      userRoles.includes('admin') ||
      userRoles.includes('official') ||
      userRoles.includes('verifier');

    const qb = this.applicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.permitType', 'permitType')
      .leftJoinAndSelect('app.applicant', 'applicant')
      .leftJoinAndSelect('app.institution', 'institution')
      .orderBy('app.updatedAt', 'DESC');

    if (!isInternal) {
      qb.andWhere('app.applicantId = :userId', { userId });
    }

    if (query.status) {
      qb.andWhere('app.status = :status', { status: query.status as string });
    }

    if (query.permit_type) {
      qb.andWhere('app.permitTypeId = :permitType', {
        permitType: query.permit_type as string,
      });
    }

    if (query.date_from) {
      qb.andWhere('app.submittedAt >= :dateFrom', {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      qb.andWhere('app.submittedAt <= :dateTo', {
        dateTo: new Date(query.date_to),
      });
    }

    if (query.assignment === 'me') {
      if (userRoles.includes('verifier')) {
        qb.andWhere('app.assignedVerifierId = :userId', { userId });
      } else if (userRoles.includes('official')) {
        qb.andWhere('app.assignedOfficialId = :userId', { userId });
      }
    }

    if (query.search) {
      qb.andWhere(
        '(app.applicationNumber ILIKE :search OR app.title ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    return qb.getMany();
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

  async reviewApplication(
    id: string,
    dto: ReviewApplicationDto,
    userId: string,
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({
      where: { id },
      relations: { documents: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    if (
      app.status !== ApplicationStatus.SUBMITTED &&
      app.status !== ApplicationStatus.ADMIN_VERIFICATION &&
      app.status !== ApplicationStatus.SUBSTANTIVE_VERIFICATION
    ) {
      throw new BadRequestException('Application is not in a reviewable state');
    }

    if (dto.documentReviews) {
      for (const dr of dto.documentReviews) {
        const doc = await this.applicationDocumentRepository.findOne({
          where: { id: dr.documentId, applicationId: id },
        });
        if (doc) {
          doc.reviewStatus = dr.status;
          await this.applicationDocumentRepository.save(doc);
        }
      }
    }

    if (dto.note) {
      const history = this.statusHistoryRepository.create({
        entityType: EntityType.APPLICATION,
        entityId: id,
        fromStatus: app.status,
        toStatus: app.status,
        actorId: userId,
        note: dto.note,
      });
      await this.statusHistoryRepository.save(history);
    }

    return app;
  }

  async requestRevision(
    id: string,
    dto: RequestRevisionDto,
    userId: string,
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    const actionListStr = JSON.stringify(dto.actionList);
    const note = `${dto.reason}\n\nActions:\n${actionListStr}`;

    return this.statusTransitionService.transitionApplication(
      app,
      ApplicationStatus.NEEDS_REVISION,
      userId,
      note,
    );
  }

  async forwardApplication(
    id: string,
    dto: ForwardApplicationDto,
    userId: string,
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    let nextStatus: ApplicationStatus;
    if (app.status === ApplicationStatus.SUBMITTED) {
      nextStatus = ApplicationStatus.ADMIN_VERIFICATION;
    } else if (app.status === ApplicationStatus.ADMIN_VERIFICATION) {
      nextStatus = ApplicationStatus.SUBSTANTIVE_VERIFICATION;
    } else if (app.status === ApplicationStatus.SUBSTANTIVE_VERIFICATION) {
      nextStatus = ApplicationStatus.AWAITING_APPROVAL;
    } else {
      throw new BadRequestException(
        'Application cannot be forwarded from its current status',
      );
    }

    return this.statusTransitionService.transitionApplication(
      app,
      nextStatus,
      userId,
      dto.note,
    );
  }

  async approveApplication(
    id: string,
    dto: ApproveApplicationDto,
    userId: string,
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    if (dto.conditions) {
      app.approvalConditions = dto.conditions;
      await this.applicationRepository.save(app);
    }

    return this.statusTransitionService.transitionApplication(
      app,
      ApplicationStatus.APPROVED,
      userId,
      dto.conditions
        ? `Approved with conditions: ${dto.conditions}`
        : 'Approved',
    );
  }

  async rejectApplication(
    id: string,
    dto: RejectApplicationDto,
    userId: string,
  ): Promise<Application> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    if (!dto.reason) {
      throw new BadRequestException('Rejection reason is mandatory');
    }

    app.rejectionReason = dto.reason;
    await this.applicationRepository.save(app);

    return this.statusTransitionService.transitionApplication(
      app,
      ApplicationStatus.REJECTED,
      userId,
      `Rejected. Reason: ${dto.reason}`,
    );
  }

  async getApplicationHistory(
    id: string,
    userId: string,
    userRoles: string[],
  ): Promise<StatusHistory[]> {
    const app = await this.applicationRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');

    const isInternal =
      userRoles.includes('admin') ||
      userRoles.includes('official') ||
      userRoles.includes('verifier');

    if (!isInternal && app.applicantId !== userId) {
      throw new ForbiddenException(
        'You can only view history for your own applications',
      );
    }

    return this.statusHistoryRepository.find({
      where: { entityType: EntityType.APPLICATION, entityId: id },
      order: { createdAt: 'DESC' },
      relations: { actor: true },
    });
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
