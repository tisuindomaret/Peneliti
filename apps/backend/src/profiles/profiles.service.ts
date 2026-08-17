import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { User } from '../users/entities/user.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { UpdateProfileDto } from './dto/profile.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(userId: string): Promise<ApplicantProfile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true, institution: true },
    });

    if (!profile) {
      // Return empty profile layout if none exists
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.passwordHash = '';
        user.verificationToken = '';
        user.resetPasswordToken = '';
      }
      return {
        id: '',
        user: user || ({ id: userId } as User),
        identityNumber: '',
        address: '',
        affiliation: '',
        institution: null as unknown as Institution,
        createdAt: new Date(),
      };
    }

    // Omit sensitive fields
    if (profile.user) {
      profile.user.passwordHash = '';
      profile.user.verificationToken = '';
      profile.user.resetPasswordToken = '';
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ApplicantProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true, institution: true },
    });

    const beforeState = profile ? { ...profile } : undefined;

    if (!profile) {
      profile = this.profileRepository.create({
        user,
        identityNumber: dto.identityNumber,
        address: dto.address,
        affiliation: dto.affiliation,
      });
    } else {
      if (dto.identityNumber !== undefined)
        profile.identityNumber = dto.identityNumber;
      if (dto.address !== undefined) profile.address = dto.address;
      if (dto.affiliation !== undefined) profile.affiliation = dto.affiliation;
    }

    if (dto.institutionId !== undefined) {
      if (dto.institutionId === null) {
        profile.institution = null as unknown as Institution;
      } else {
        const institution = await this.institutionRepository.findOne({
          where: { id: dto.institutionId, ownerUser: { id: userId } },
        });
        if (!institution) {
          throw new NotFoundException(
            'Institution not found or not owned by user',
          );
        }
        profile.institution = institution;
      }
    }

    const savedProfile = await this.profileRepository.save(profile);

    await this.auditService.record({
      actorId: userId,
      action: beforeState ? 'update' : 'create',
      objectType: 'applicant_profile',
      objectId: savedProfile.id,
      beforeState: beforeState,
      afterState: savedProfile,
    });

    return savedProfile;
  }
}
