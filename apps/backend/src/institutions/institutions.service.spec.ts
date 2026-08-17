import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionsService } from './institutions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Institution } from './entities/institution.entity';
import { User } from '../users/entities/user.entity';
import { FileEntity } from '../files/entities/file.entity';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('InstitutionsService', () => {
  let service: InstitutionsService;

  const mockInstitutionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockFileRepo = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        {
          provide: getRepositoryToken(Institution),
          useValue: mockInstitutionRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockFileRepo,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<InstitutionsService>(InstitutionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInstitution', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createInstitution('user-id', {
          name: 'Inst',
          address: 'Add',
          contact: 'con',
          responsibleOfficer: 'Off',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if legalDocumentFileId is provided but file is not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 'user-id' });
      mockFileRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createInstitution('user-id', {
          name: 'Inst',
          address: 'Add',
          contact: 'con',
          responsibleOfficer: 'Off',
          legalDocumentFileId: 'file-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if legalDocumentFileId does not belong to the user', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 'user-id' });
      mockFileRepo.findOne.mockResolvedValueOnce({
        id: 'file-id',
        uploadedBy: { id: 'other-user-id' },
      });

      await expect(
        service.createInstitution('user-id', {
          name: 'Inst',
          address: 'Add',
          contact: 'con',
          responsibleOfficer: 'Off',
          legalDocumentFileId: 'file-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an institution successfully', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ id: 'user-id' });
      mockFileRepo.findOne.mockResolvedValueOnce({
        id: 'file-id',
        uploadedBy: { id: 'user-id' },
      });
      mockInstitutionRepo.create.mockReturnValueOnce({ name: 'Inst' });
      mockInstitutionRepo.save.mockResolvedValueOnce({
        id: 'inst-id',
        name: 'Inst',
      });

      const result = await service.createInstitution('user-id', {
        name: 'Inst',
        address: 'Add',
        contact: 'con',
        responsibleOfficer: 'Off',
        legalDocumentFileId: 'file-id',
      });

      expect(result).toEqual({ id: 'inst-id', name: 'Inst' });
      expect(mockAuditService.record).toHaveBeenCalled();
    });
  });
});
