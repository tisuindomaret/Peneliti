import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PermitsService } from './permits.service';
import { CancelPermitDto } from './dto/cancel-permit.dto';
import { RevisePermitDto } from './dto/revise-permit.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

interface RequestWithUser extends Request {
  user: User & { roles?: string[] };
}

@Controller('api/v1/permits')
export class PermitsController {
  constructor(private readonly permitsService: PermitsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async getPermit(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.permitsService.getPermit(
      id,
      req.user.id,
      req.user.roles?.[0] || 'applicant',
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/download')
  async downloadPermit(@Param('id') id: string, @Req() req: RequestWithUser) {
    const permit = await this.permitsService.getPermit(
      id,
      req.user.id,
      req.user.roles?.[0] || 'applicant',
    );
    return { url: `/api/v1/files/${permit.pdfFileId}/download` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'official')
  @Post(':id/cancel')
  async cancelPermit(
    @Param('id') id: string,
    @Body() dto: CancelPermitDto,
    @Req() req: RequestWithUser,
  ) {
    return this.permitsService.cancelPermit(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'official')
  @Post(':id/revise')
  async revisePermit(
    @Param('id') id: string,
    @Body() dto: RevisePermitDto,
    @Req() req: RequestWithUser,
  ) {
    return this.permitsService.revisePermit(id, dto, req.user.id);
  }
}
