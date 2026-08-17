import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicantProfile } from './entities/applicant-profile.entity';
import { User } from '../users/entities/user.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('ProfilesService', () => {
  let service: ProfilesService;

  const mockProfileRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockInstitutionRepo = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(ApplicantProfile),
          useValue: mockProfileRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Institution),
          useValue: mockInstitutionRepo,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.updateProfile('user-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if institutionId is provided but not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 'user-id' });
      mockProfileRepo.findOne.mockResolvedValueOnce(null);
      mockInstitutionRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateProfile('user-id', { institutionId: 'inst-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle profile creation if none exists', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 'user-id' });
      mockProfileRepo.findOne.mockResolvedValueOnce(null);
      mockProfileRepo.create.mockReturnValueOnce({ identityNumber: '123' });
      mockProfileRepo.save.mockResolvedValueOnce({
        id: 'profile-id',
        identityNumber: '123',
      });

      const result = await service.updateProfile('user-id', {
        identityNumber: '123',
      });
      expect(result).toEqual({ id: 'profile-id', identityNumber: '123' });
    });
  });
});
