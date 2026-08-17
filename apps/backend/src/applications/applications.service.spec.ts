import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { ApplicationDocument } from './entities/application-document.entity';
import { PermitRequirement } from '../permit-types/entities/permit-requirement.entity';
import { StatusHistory } from '../shared/entities/status-history.entity';
import { AuditService } from '../audit/audit.service';
import { FilesService } from '../files/files.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ApplicationsService - Full Flow', () => {
  let service: ApplicationsService;

  const mockAppRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockAppDocRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockPermitReqRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockStatusHistoryRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditService = {
    record: jest.fn(),
  };

  const mockFilesService = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: getRepositoryToken(Application), useValue: mockAppRepo },
        {
          provide: getRepositoryToken(ApplicationDocument),
          useValue: mockAppDocRepo,
        },
        {
          provide: getRepositoryToken(PermitRequirement),
          useValue: mockPermitReqRepo,
        },
        {
          provide: getRepositoryToken(StatusHistory),
          useValue: mockStatusHistoryRepo,
        },
        { provide: AuditService, useValue: mockAuditService },
        { provide: FilesService, useValue: mockFilesService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should validate size and format successfully', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app1',
        applicantId: 'user1',
        status: ApplicationStatus.DRAFT,
      });
      mockPermitReqRepo.findOne.mockResolvedValue({
        id: 'req1',
        max_size_mb: 2,
        accepted_formats: ['pdf'],
      });
      mockFilesService.uploadFile.mockResolvedValue({ id: 'file1' });
      mockAppDocRepo.findOne.mockResolvedValue(null);
      mockAppDocRepo.create.mockReturnValue({ id: 'doc1' });
      mockAppDocRepo.save.mockResolvedValue({ id: 'doc1' });

      const file = {
        size: 1024 * 1024,
        originalname: 'test.pdf',
      } as Express.Multer.File;

      const result = await service.uploadDocument(
        'app1',
        'user1',
        'req1',
        file,
      );
      expect(result.id).toBe('doc1');
    });

    it('should throw BadRequestException if size is exceeded', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app1',
        applicantId: 'user1',
        status: ApplicationStatus.DRAFT,
      });
      mockPermitReqRepo.findOne.mockResolvedValue({
        id: 'req1',
        max_size_mb: 1,
        accepted_formats: ['pdf'],
      });

      const file = {
        size: 2 * 1024 * 1024,
        originalname: 'test.pdf',
      } as Express.Multer.File;

      await expect(
        service.uploadDocument('app1', 'user1', 'req1', file),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitApplication', () => {
    it('should block submission if checklist is incomplete', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app1',
        applicantId: 'user1',
        status: ApplicationStatus.DRAFT,
        permitTypeId: 'pt1',
      });
      mockPermitReqRepo.find.mockResolvedValue([
        { id: 'req1', is_mandatory: true },
      ]);
      mockAppDocRepo.find.mockResolvedValue([]); // No docs uploaded

      await expect(service.submitApplication('app1', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should submit successfully and assign number', async () => {
      const app = {
        id: 'app1',
        applicantId: 'user1',
        status: ApplicationStatus.DRAFT,
        permitTypeId: 'pt1',
        permitType: { numbering_pattern: 'APP/{YYYY}/{SEQ}' },
      };
      mockAppRepo.findOne.mockResolvedValue(app);
      mockPermitReqRepo.find.mockResolvedValue([
        { id: 'req1', is_mandatory: true },
      ]);
      mockAppDocRepo.find.mockResolvedValue([
        { requirementId: 'req1', reviewStatus: 'pending', fileId: 'f1' },
      ]);
      mockAppRepo.count.mockResolvedValue(42);
      mockAppRepo.save.mockImplementation((a) => Promise.resolve(a));
      mockStatusHistoryRepo.create.mockReturnValue({});

      const result = await service.submitApplication('app1', 'user1');

      expect(result.status).toBe(ApplicationStatus.SUBMITTED);
      expect(result.applicationNumber).toBe(
        `APP/${new Date().getFullYear()}/0043`,
      );
    });
  });

  describe('findAll / findOne (RBAC)', () => {
    it('should allow internal users to see any application', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app1',
        applicantId: 'user1',
      });
      const result = await service.findOne('app1', 'admin_user', ['admin']);
      expect(result).toBeDefined();
    });

    it('should throw Forbidden if applicant tries to see another users application', async () => {
      mockAppRepo.findOne.mockResolvedValue({
        id: 'app1',
        applicantId: 'user2',
      });
      await expect(
        service.findOne('app1', 'user1', ['applicant']),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
