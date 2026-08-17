import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PermitTypesService } from './permit-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePermitTypeDto } from './dto/create-permit-type.dto';
import { UpdatePermitTypeDto } from './dto/update-permit-type.dto';
import { CreatePermitRequirementDto } from './dto/create-permit-requirement.dto';
import { UpdatePermitRequirementDto } from './dto/update-permit-requirement.dto';

interface RequestWithUser {
  user?: {
    id: string;
    roles: string[];
  };
}

@Controller('permit-types')
export class PermitTypesController {
  constructor(private readonly permitTypesService: PermitTypesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Request() req: RequestWithUser) {
    const user = req.user;
    const isAdmin = user && user.roles && user.roles.includes('admin');
    const items = await this.permitTypesService.findAll(isAdmin);
    return { data: items };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const item = await this.permitTypesService.findOne(id);
    return { data: item };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(
    @Body() createDto: CreatePermitTypeDto,
    @Request() req: Required<RequestWithUser>,
  ) {
    const item = await this.permitTypesService.create(createDto, req.user.id);
    return { data: item };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePermitTypeDto,
    @Request() req: Required<RequestWithUser>,
  ) {
    const item = await this.permitTypesService.update(
      id,
      updateDto,
      req.user.id,
    );
    return { data: item };
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async activate(
    @Param('id') id: string,
    @Request() req: Required<RequestWithUser>,
  ) {
    const item = await this.permitTypesService.toggleActive(
      id,
      true,
      req.user.id,
    );
    return { data: item };
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deactivate(
    @Param('id') id: string,
    @Request() req: Required<RequestWithUser>,
  ) {
    const item = await this.permitTypesService.toggleActive(
      id,
      false,
      req.user.id,
    );
    return { data: item };
  }

  @Post(':id/requirements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addRequirement(
    @Param('id') id: string,
    @Body() createDto: CreatePermitRequirementDto,
    @Request() req: Required<RequestWithUser>,
  ) {
    const item = await this.permitTypesService.addRequirement(
      id,
      createDto,
      req.user.id,
    );
    return { data: item };
  }
}

@Controller('requirements')
export class PermitRequirementsController {
  constructor(private readonly permitTypesService: PermitTypesService) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateRequirement(
    @Param('id') id: string,
    @Body() updateDto: UpdatePermitRequirementDto,
    @Request() req: Required<RequestWithUser>,
  ) {
    const item = await this.permitTypesService.updateRequirement(
      id,
      updateDto,
      req.user.id,
    );
    return { data: item };
  }
}
