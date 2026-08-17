import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'actor_id' })
  actorId: string | null;

  @Column({ type: 'text' })
  action: string;

  @Column({ type: 'text', name: 'object_type' })
  objectType: string;

  @Column({ type: 'uuid', nullable: true, name: 'object_id' })
  objectId: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'before_state' })
  beforeState: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'after_state' })
  afterState: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
