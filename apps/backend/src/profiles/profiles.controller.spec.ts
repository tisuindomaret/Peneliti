import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { Request } from 'express';

describe('ProfilesController', () => {
  let controller: ProfilesController;

  const mockProfilesService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
      ],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return profile for getProfile', async () => {
    const req = { user: { id: 'test-user-id' } } as unknown as Request & {
      user: { id: string };
    };
    mockProfilesService.getProfile.mockResolvedValueOnce({ id: 'profile-id' });
    const result = await controller.getProfile(req);
    expect(result).toEqual({ id: 'profile-id' });
    expect(mockProfilesService.getProfile).toHaveBeenCalledWith('test-user-id');
  });

  it('should update profile for updateProfile', async () => {
    const req = { user: { id: 'test-user-id' } } as unknown as Request & {
      user: { id: string };
    };
    const dto = { identityNumber: '123' };
    mockProfilesService.updateProfile.mockResolvedValueOnce({
      id: 'profile-id',
      identityNumber: '123',
    });
    const result = await controller.updateProfile(req, dto);
    expect(result).toEqual({ id: 'profile-id', identityNumber: '123' });
    expect(mockProfilesService.updateProfile).toHaveBeenCalledWith(
      'test-user-id',
      dto,
    );
  });
});
