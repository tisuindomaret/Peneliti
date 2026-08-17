import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;

  beforeState?: Record<string, any>;

  afterState?: Record<string, any>;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async record(input: AuditLogInput): Promise<AuditLog | null> {
    try {
      const auditLog = this.auditLogRepository.create({
        actorId: input.actorId ?? null,
        action: input.action,
        objectType: input.objectType,
        objectId: input.objectId ?? null,

        beforeState: input.beforeState ?? null,

        afterState: input.afterState ?? null,
        ipAddress: input.ipAddress ?? null,
      });

      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for ${input.action} on ${input.objectType}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
