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
import { PermitsService } from '../permits/permits.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { ReviewApplicationDto } from './dto/review-application.dto';
import {
  RequestRevisionDto,
  ForwardApplicationDto,
  ApproveApplicationDto,
  RejectApplicationDto,
} from './dto/review-action.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('api/v1/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly permitsService: PermitsService,
  ) {}

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const roles = req.user.userRoles?.map((ur) => ur.role.name) || [
      'applicant',
    ];
    return this.applicationsService.findAll(req.user.id, roles, req.query);
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

  @Post(':id/reviews')
  @Roles('verifier')
  async reviewApplication(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.applicationsService.reviewApplication(id, dto, req.user.id);
  }

  @Post(':id/request-revision')
  @Roles('verifier')
  async requestRevision(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: RequestRevisionDto,
  ) {
    return this.applicationsService.requestRevision(id, dto, req.user.id);
  }

  @Post(':id/forward')
  @Roles('verifier')
  async forwardApplication(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: ForwardApplicationDto,
  ) {
    return this.applicationsService.forwardApplication(id, dto, req.user.id);
  }

  @Post(':id/approve')
  @Roles('official')
  async approveApplication(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: ApproveApplicationDto,
  ) {
    return this.applicationsService.approveApplication(id, dto, req.user.id);
  }

  @Post(':id/reject')
  @Roles('official')
  async rejectApplication(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.applicationsService.rejectApplication(id, dto, req.user.id);
  }

  @Get(':id/history')
  async getApplicationHistory(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const roles = req.user.userRoles?.map((ur) => ur.role.name) || [
      'applicant',
    ];
    return this.applicationsService.getApplicationHistory(
      id,
      req.user.id,
      roles,
    );
  }

  @Post(':id/issue-permit')
  @Roles('official', 'admin', 'system')
  async issuePermit(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.permitsService.issuePermit(id, req.user.id);
  }
}
