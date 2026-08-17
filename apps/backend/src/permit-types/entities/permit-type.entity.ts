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
import { DocumentTemplate } from './document-template.entity';
import { PermitRequirement } from './permit-requirement.entity';

@Entity('permit_types')
export class PermitType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'integer' })
  validity_period_days: number;

  @Column({ type: 'text' })
  numbering_pattern: string;

  @Column({ type: 'uuid', nullable: true })
  pdf_template_id: string | null;

  @ManyToOne(() => DocumentTemplate, (template) => template.permit_types, {
    nullable: true,
  })
  @JoinColumn({ name: 'pdf_template_id' })
  pdf_template: DocumentTemplate | null;

  @OneToMany(() => PermitRequirement, (requirement) => requirement.permit_type)
  requirements: PermitRequirement[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
