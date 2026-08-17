import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'original_filename' })
  originalFilename: string;

  @Column({ type: 'text', name: 'storage_path' })
  storagePath: string;

  @Column({ type: 'text', name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'bigint', name: 'size_bytes' })
  sizeBytes: number;

  @Column({ type: 'text', nullable: true })
  checksum: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
