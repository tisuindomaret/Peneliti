import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EntityType {
  APPLICATION = 'application',
  RESEARCH_OUTPUT = 'research_output',
}

@Entity('status_history')
export class StatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: EntityType, name: 'entity_type' })
  entityType: EntityType;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'text', nullable: true, name: 'from_status' })
  fromStatus: string | null;

  @Column({ type: 'text', name: 'to_status' })
  toStatus: string;

  @Column({ type: 'uuid', nullable: true, name: 'actor_id' })
  actorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
