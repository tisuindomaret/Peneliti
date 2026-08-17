import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const roles = req.user.userRoles?.map((ur) => ur.role.name) || [
      'applicant',
    ];
    return this.applicationsService.findAll(req.user.id, roles);
  }

  @Post()
  @Roles('applicant')
  async createDraft(
    @Req() req: RequestWithUser,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.createDraft(req.user.id, dto, req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const roles = req.user.userRoles?.map((ur) => ur.role.name) || [
      'applicant',
    ];
    return this.applicationsService.findOne(id, req.user.id, roles);
  }

  @Put(':id')
  @Roles('applicant')
  async updateDraft(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.updateDraft(id, req.user.id, dto);
  }

  @Post(':id/documents')
  @Roles('applicant')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: UploadDocumentDto,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.applicationsService.uploadDocument(
      id,
      req.user.id,
      dto.requirement_id,
      file,
    );
  }

  @Get(':id/checklist')
  @Roles('applicant')
  async getChecklist(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Record<string, unknown>> {
    return this.applicationsService.getChecklist(id, req.user.id);
  }

  @Post(':id/submit')
  @Roles('applicant')
  async submitApplication(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.applicationsService.submitApplication(
      id,
      req.user.id,
      req.user,
    );
  }
}
