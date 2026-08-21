import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryColumn({ name: 'event_type', type: 'text' })
  eventType: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ name: 'body_template', type: 'text' })
  bodyTemplate: string;

  @Column({ name: 'required_variables', type: 'jsonb', nullable: true })
  requiredVariables: string[];

  @Column({ name: 'internal_recipients', type: 'jsonb', nullable: true })
  internalRecipients: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
