import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateInstitutionDto } from './dto/institution.dto';
import { Request } from 'express';

@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @Roles('applicant')
  async createInstitution(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateInstitutionDto,
  ) {
    return this.institutionsService.createInstitution(req.user.id, dto);
  }
}
