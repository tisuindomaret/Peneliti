import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { Request } from 'express';

describe('InstitutionsController', () => {
  let controller: InstitutionsController;

  const mockInstitutionsService = {
    createInstitution: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstitutionsController],
      providers: [
        {
          provide: InstitutionsService,
          useValue: mockInstitutionsService,
        },
      ],
    }).compile();

    controller = module.get<InstitutionsController>(InstitutionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an institution', async () => {
    const req = { user: { id: 'test-user-id' } } as unknown as Request & {
      user: { id: string };
    };
    const dto = {
      name: 'Inst',
      address: 'Add',
      contact: 'con',
      responsibleOfficer: 'Off',
    };
    mockInstitutionsService.createInstitution.mockResolvedValueOnce({
      id: 'inst-id',
      ...dto,
    });
    const result = await controller.createInstitution(req, dto);
    expect(result).toEqual({ id: 'inst-id', ...dto });
    expect(mockInstitutionsService.createInstitution).toHaveBeenCalledWith(
      'test-user-id',
      dto,
    );
  });
});
