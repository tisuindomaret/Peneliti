/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PermitTypesService } from './permit-types.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermitType } from './entities/permit-type.entity';
import { PermitRequirement } from './entities/permit-requirement.entity';
import { DocumentTemplate } from './entities/document-template.entity';
import { AuditService } from '../audit/audit.service';

const mockPermitType = { id: 'uuid-1', name: 'Test Permit', is_active: true };

describe('PermitTypesService', () => {
  let service: PermitTypesService;
  let auditService: jest.Mocked<AuditService>;

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockPermitType]),
    findOne: jest.fn().mockResolvedValue(mockPermitType),
    create: jest.fn().mockReturnValue(mockPermitType),
    save: jest.fn().mockResolvedValue(mockPermitType),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermitTypesService,
        {
          provide: getRepositoryToken(PermitType),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(PermitRequirement),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(DocumentTemplate),
          useValue: mockRepo,
        },
        {
          provide: AuditService,
          useValue: {
            record: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<PermitTypesService>(PermitTypesService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should toggle active status and audit it', async () => {
    await service.toggleActive('uuid-1', false, 'admin-id');

    expect(auditService.record as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'permit_type.deactivated',
        objectType: 'permit_type',
        objectId: 'uuid-1',
        actorId: 'admin-id',
      }),
    );
  });
});
