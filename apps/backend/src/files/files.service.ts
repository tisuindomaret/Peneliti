import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    storagePath: string,
  ): Promise<FileEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const fileEntity = this.fileRepository.create({
      originalFilename: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: user,
    });

    const savedFile = await this.fileRepository.save(fileEntity);

    await this.auditService.record({
      actorId: userId,
      action: 'upload',
      objectType: 'file',
      objectId: savedFile.id,
      afterState: savedFile,
    });

    return savedFile;
  }
}
