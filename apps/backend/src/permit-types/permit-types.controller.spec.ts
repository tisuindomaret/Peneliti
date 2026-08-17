/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  PermitTypesController,
  PermitRequirementsController,
} from './permit-types.controller';
import { PermitTypesService } from './permit-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('PermitTypesController', () => {
  let controller: PermitTypesController;
  let service: PermitTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermitTypesController, PermitRequirementsController],
      providers: [
        {
          provide: PermitTypesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            toggleActive: jest
              .fn()
              .mockResolvedValue({ id: 'uuid-1', is_active: true }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PermitTypesController>(PermitTypesController);
    service = module.get<PermitTypesService>(PermitTypesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all permits passing isAdmin flag', async () => {
    const req = { user: { id: 'admin', roles: ['admin'] } };
    await controller.findAll(req);
    expect(service.findAll as jest.Mock).toHaveBeenCalledWith(true);
  });
});
