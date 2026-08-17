import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './user-role.entity';

export enum ApplicantType {
  INDIVIDUAL = 'individual',
  INSTITUTION = 'institution',
}

export enum UserStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ApplicantType,
    nullable: true,
    name: 'applicant_type',
  })
  applicantType: ApplicantType;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt: Date;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'deactivated_at' })
  deactivatedAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Additional fields for auth flows (FR-01)
  @Column({ type: 'text', nullable: true, name: 'verification_token' })
  verificationToken: string;

  @Column({ type: 'text', nullable: true, name: 'reset_password_token' })
  resetPasswordToken: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'reset_password_expires_at',
  })
  resetPasswordExpiresAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];
}
