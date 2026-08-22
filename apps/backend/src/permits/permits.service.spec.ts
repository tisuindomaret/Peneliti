import { Test, TestingModule } from '@nestjs/testing';
import { PermitsService } from './permits.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permit, PermitStatus } from './entities/permit.entity';
import {
  Application,
  ApplicationStatus,
} from '../applications/entities/application.entity';
import { AuditService } from '../audit/audit.service';
import { FilesService } from '../files/files.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('PermitsService', () => {
  let service: PermitsService;
  let permitRepo: Record<string, jest.Mock>;
  let applicationRepo: Record<string, jest.Mock>;
  let auditService: Record<string, jest.Mock>;
  let filesService: Record<string, jest.Mock>;

  beforeEach(async () => {
    permitRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest
        .fn()
        .mockImplementation((dto: Record<string, unknown>) => dto),
      save: jest.fn().mockImplementation((dto: Record<string, unknown>) => ({
        id: 'permit-123',
        ...dto,
      })),
    };

    applicationRepo = {
      findOne: jest.fn(),
    };

    auditService = {
      record: jest.fn(),
    };

    filesService = {
      uploadFile: jest.fn().mockResolvedValue({ id: 'file-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermitsService,
        { provide: getRepositoryToken(Permit), useValue: permitRepo },
        { provide: getRepositoryToken(Application), useValue: applicationRepo },
        { provide: AuditService, useValue: auditService },
        { provide: FilesService, useValue: filesService },
      ],
    }).compile();

    service = module.get<PermitsService>(PermitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issuePermit', () => {
    it('should generate a unique permit number and issue permit for approved application', async () => {
      const app = {
        id: 'app-1',
        status: ApplicationStatus.APPROVED,
        periodStart: new Date(),
        periodEnd: new Date(),
        applicant: { name: 'Test Applicant' },
      };
      applicationRepo.findOne.mockResolvedValue(app);
      permitRepo.findOne.mockResolvedValue(null);

      const result = await service.issuePermit('app-1', 'user-1');

      expect(permitRepo.count).toHaveBeenCalled();
      expect(result.permitNumber).toContain('IZIN-PENELITIAN');
      expect(result.status).toBe(PermitStatus.ACTIVE);
      expect(auditService.record).toHaveBeenCalled();
      expect(filesService.uploadFile).toHaveBeenCalled();
    });

    it('should reject if application is not approved', async () => {
      const app = {
        id: 'app-1',
        status: ApplicationStatus.SUBMITTED,
      };
      applicationRepo.findOne.mockResolvedValue(app);

      await expect(service.issuePermit('app-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if permit already exists', async () => {
      const app = { id: 'app-1', status: ApplicationStatus.APPROVED };
      applicationRepo.findOne.mockResolvedValue(app);
      permitRepo.findOne.mockResolvedValue({ id: 'permit-1' });

      await expect(service.issuePermit('app-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPermit', () => {
    it('should allow owner to access', async () => {
      const permit = {
        id: 'permit-1',
        application: { applicantId: 'owner-1' },
      };
      permitRepo.findOne.mockResolvedValue(permit);

      const result = await service.getPermit(
        'permit-1',
        'owner-1',
        'applicant',
      );
      expect(result).toBeDefined();
    });

    it('should forbid non-owner non-admin', async () => {
      const permit = {
        id: 'permit-1',
        application: { applicantId: 'owner-1' },
      };
      permitRepo.findOne.mockResolvedValue(permit);

      await expect(
        service.getPermit('permit-1', 'other-1', 'applicant'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelPermit', () => {
    it('should cancel active permit and audit', async () => {
      const permit = { id: 'permit-1', status: PermitStatus.ACTIVE };
      permitRepo.findOne.mockResolvedValue(permit);
      permitRepo.save.mockResolvedValue({
        ...permit,
        status: PermitStatus.CANCELLED,
      });

      const result = await service.cancelPermit(
        'permit-1',
        { reason: 'Test' },
        'user-1',
      );
      expect(result.status).toBe(PermitStatus.CANCELLED);
      expect(auditService.record).toHaveBeenCalled();
    });

    it('should prevent cancelling non-active permit', async () => {
      const permit = { id: 'permit-1', status: PermitStatus.EXPIRED };
      permitRepo.findOne.mockResolvedValue(permit);

      await expect(
        service.cancelPermit('permit-1', {}, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revisePermit', () => {
    it('should mark old permit superseded and create new one', async () => {
      const oldPermit = {
        id: 'permit-1',
        status: PermitStatus.ACTIVE,
        applicationId: 'app-1',
        application: {
          id: 'app-1',
          periodStart: new Date(),
          periodEnd: new Date(),
        },
      };
      permitRepo.findOne.mockResolvedValue(oldPermit);
      permitRepo.count.mockResolvedValue(1);

      const result = await service.revisePermit(
        'permit-1',
        { reason: 'Revision' },
        'user-1',
      );

      expect(oldPermit.status).toBe(PermitStatus.SUPERSEDED);
      expect(result.supersededByPermitId).toBe('permit-1');
      expect(result.permitNumber).toContain('IZIN-PENELITIAN');
      expect(auditService.record).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyByNumber & verifyByToken', () => {
    it('should return filtered public data', async () => {
      const permit = {
        id: 'permit-1',
        status: PermitStatus.ACTIVE,
        permitNumber: '123',
        validFrom: new Date(),
        validUntil: new Date(),
        application: {
          title: 'Test Title',
          applicant: { name: 'John Doe', email: 'secret@email.com' },
          institution: { name: 'Test Univ' },
        },
      };
      permitRepo.findOne.mockResolvedValue(permit);

      const result = await service.verifyByNumber('123');
      expect(result.status).toBe(PermitStatus.ACTIVE);
      expect(result.permitNumber).toBe('123');
      expect(result.applicantName).toBe('John Doe');
      expect(result.email).toBeUndefined();
    });
  });
});
