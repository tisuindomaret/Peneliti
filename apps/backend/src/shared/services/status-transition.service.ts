import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusHistory, EntityType } from '../entities/status-history.entity';
import { AuditService } from '../../audit/audit.service';
import {
  ApplicationStatus,
  Application,
} from '../../applications/entities/application.entity';

@Injectable()
export class StatusTransitionService {
  constructor(
    @InjectRepository(StatusHistory)
    private readonly statusHistoryRepo: Repository<StatusHistory>,
    private readonly auditService: AuditService,
  ) {}

  private readonly allowedTransitions: Record<
    ApplicationStatus,
    ApplicationStatus[]
  > = {
    [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.SUBMITTED]: [ApplicationStatus.ADMIN_VERIFICATION],
    [ApplicationStatus.NEEDS_REVISION]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.ADMIN_VERIFICATION]: [
      ApplicationStatus.NEEDS_REVISION,
      ApplicationStatus.SUBSTANTIVE_VERIFICATION,
    ],
    [ApplicationStatus.SUBSTANTIVE_VERIFICATION]: [
      ApplicationStatus.NEEDS_REVISION,
      ApplicationStatus.AWAITING_APPROVAL,
    ],
    [ApplicationStatus.AWAITING_APPROVAL]: [
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
    ],
    [ApplicationStatus.APPROVED]: [
      ApplicationStatus.COMPLETED,
      ApplicationStatus.EXPIRED,
    ],
    [ApplicationStatus.REJECTED]: [],
    [ApplicationStatus.EXPIRED]: [ApplicationStatus.COMPLETED],
    [ApplicationStatus.COMPLETED]: [],
  };

  async transitionApplication(
    application: Application,
    newStatus: ApplicationStatus,
    actorId: string,
    note?: string,
  ): Promise<Application> {
    const fromStatus = application.status;

    if (fromStatus === newStatus) {
      return application;
    }

    const allowed = this.allowedTransitions[fromStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition application from ${fromStatus} to ${newStatus}`,
      );
    }

    const beforeState = { ...application };

    application.status = newStatus;

    if (
      newStatus === ApplicationStatus.APPROVED ||
      newStatus === ApplicationStatus.REJECTED
    ) {
      application.decidedAt = new Date();
    }

    const history = this.statusHistoryRepo.create({
      entityType: EntityType.APPLICATION,
      entityId: application.id,
      fromStatus,
      toStatus: newStatus,
      actorId,
      note,
    });

    await this.statusHistoryRepo.save(history);

    await this.auditService.record({
      actorId,
      action: `application.status_changed`,
      objectType: 'application',
      objectId: application.id,
      beforeState,
      afterState: { ...application },
    });

    return application;
  }
}
