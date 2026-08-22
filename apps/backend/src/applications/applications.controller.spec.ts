import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { PermitsService } from '../permits/permits.service';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    createDraft: jest.fn(),
    updateDraft: jest.fn(),
    uploadDocument: jest.fn(),
    getChecklist: jest.fn(),
    submitApplication: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: mockService },
        { provide: PermitsService, useValue: {} }, // Mock PermitsService
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
