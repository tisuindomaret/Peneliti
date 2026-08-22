import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';
import { FileEntity } from '../../files/entities/file.entity';

export enum PermitStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUPERSEDED = 'superseded',
}

@Entity('permits')
export class Permit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'text', unique: true, name: 'permit_number' })
  permitNumber: string;

  @Column({ type: 'timestamp', name: 'issued_at' })
  issuedAt: Date;

  @Column({ type: 'date', name: 'valid_from' })
  validFrom: Date;

  @Column({ type: 'date', name: 'valid_until' })
  validUntil: Date;

  @Column({ type: 'uuid', name: 'pdf_file_id', nullable: true })
  pdfFileId: string | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'pdf_file_id' })
  pdfFile: FileEntity | null;

  @Column({ type: 'text', unique: true, name: 'verification_token' })
  verificationToken: string;

  @Column({
    type: 'enum',
    enum: PermitStatus,
    default: PermitStatus.ACTIVE,
  })
  status: PermitStatus;

  @Column({ type: 'uuid', name: 'superseded_by_permit_id', nullable: true })
  supersededByPermitId: string | null;

  @ManyToOne(() => Permit, { nullable: true })
  @JoinColumn({ name: 'superseded_by_permit_id' })
  supersededByPermit: Permit | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
