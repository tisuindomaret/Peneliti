import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateProfileDto } from './dto/profile.dto';
import { Request } from 'express';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @Roles('applicant')
  async getProfile(@Req() req: Request & { user: { id: string } }) {
    return this.profilesService.getProfile(req.user.id);
  }

  @Put()
  @Roles('applicant')
  async updateProfile(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(req.user.id, dto);
  }
}
