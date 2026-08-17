import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from './entities/institution.entity';
import { User } from '../users/entities/user.entity';
import { FileEntity } from '../files/entities/file.entity';
import { CreateInstitutionDto } from './dto/institution.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly auditService: AuditService,
  ) {}

  async createInstitution(
    userId: string,
    dto: CreateInstitutionDto,
  ): Promise<Institution> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let legalDocumentFile = null;
    if (dto.legalDocumentFileId) {
      legalDocumentFile = await this.fileRepository.findOne({
        where: { id: dto.legalDocumentFileId },
        relations: { uploadedBy: true },
      });
      if (!legalDocumentFile) {
        throw new BadRequestException('Legal document file not found');
      }
      if (legalDocumentFile.uploadedBy?.id !== userId) {
        throw new BadRequestException(
          'You do not have permission to use this file',
        );
      }
    }

    const institution = this.institutionRepository.create({
      name: dto.name,
      address: dto.address,
      contact: dto.contact,
      responsibleOfficer: dto.responsibleOfficer,
      ownerUser: user,
      legalDocumentFile: legalDocumentFile ? legalDocumentFile : undefined,
    });

    const savedInstitution = await this.institutionRepository.save(institution);

    await this.auditService.record({
      actorId: userId,
      action: 'create',
      objectType: 'institution',
      objectId: savedInstitution.id,
      afterState: savedInstitution,
    });

    return savedInstitution;
  }
}
