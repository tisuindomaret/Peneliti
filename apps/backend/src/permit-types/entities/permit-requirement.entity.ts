import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PermitType } from './permit-type.entity';

@Entity('permit_requirements')
export class PermitRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  permit_type_id: string;

  @ManyToOne(() => PermitType, (permitType) => permitType.requirements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permit_type_id' })
  permit_type: PermitType;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_mandatory: boolean;

  @Column({ type: 'text', array: true })
  accepted_formats: string[];

  @Column({ type: 'integer' })
  max_size_mb: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
