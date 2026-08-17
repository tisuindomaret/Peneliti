import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { PermitRequirement } from '../../permit-types/entities/permit-requirement.entity';
import { FileEntity } from '../../files/entities/file.entity';

export enum DocumentReviewStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  NEEDS_REVISION = 'needs_revision',
  REJECTED = 'rejected',
}

@Entity('application_documents')
export class ApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application, (app) => app.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'uuid', nullable: true, name: 'requirement_id' })
  requirementId: string | null;

  @ManyToOne(() => PermitRequirement, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requirement_id' })
  requirement: PermitRequirement | null;

  @Column({ type: 'uuid', name: 'file_id' })
  fileId: string;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({
    type: 'enum',
    enum: DocumentReviewStatus,
    default: DocumentReviewStatus.PENDING,
    name: 'review_status',
  })
  reviewStatus: DocumentReviewStatus;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
