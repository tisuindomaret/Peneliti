import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PermitType } from '../../permit-types/entities/permit-type.entity';
import { User } from '../../users/entities/user.entity';
import { Institution } from '../../institutions/entities/institution.entity';
import { ApplicationDocument } from './application-document.entity';

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  NEEDS_REVISION = 'needs_revision',
  ADMIN_VERIFICATION = 'admin_verification',
  SUBSTANTIVE_VERIFICATION = 'substantive_verification',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  COMPLETED = 'completed',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text',
    unique: true,
    nullable: true,
    name: 'application_number',
  })
  applicationNumber: string | null;

  @Column({ type: 'uuid', name: 'permit_type_id' })
  permitTypeId: string;

  @ManyToOne(() => PermitType)
  @JoinColumn({ name: 'permit_type_id' })
  permitType: PermitType;

  @Column({ type: 'uuid', name: 'applicant_id' })
  applicantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @Column({ type: 'uuid', nullable: true, name: 'institution_id' })
  institutionId: string | null;

  @ManyToOne(() => Institution, { nullable: true })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution | null;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'field_topic' })
  fieldTopic: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'date', nullable: true, name: 'period_start' })
  periodStart: Date;

  @Column({ type: 'date', nullable: true, name: 'period_end' })
  periodEnd: Date;

  @Column({ type: 'text', nullable: true })
  objective: string;

  @Column({ type: 'text', nullable: true, name: 'method_summary' })
  methodSummary: string;

  @Column({ type: 'text', nullable: true, name: 'principal_investigator' })
  principalInvestigator: string;

  @Column({ type: 'jsonb', nullable: true, name: 'team_members' })
  teamMembers: Record<string, unknown>[];

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_verifier_id' })
  assignedVerifierId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_verifier_id' })
  assignedVerifier: User | null;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_official_id' })
  assignedOfficialId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_official_id' })
  assignedOfficial: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'submitted_at' })
  submittedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'decided_at' })
  decidedAt: Date | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true, name: 'approval_conditions' })
  approvalConditions: string | null;

  @OneToMany(() => ApplicationDocument, (doc) => doc.application)
  documents: ApplicationDocument[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
