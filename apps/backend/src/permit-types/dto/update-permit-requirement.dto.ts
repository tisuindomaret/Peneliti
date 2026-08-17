import { PartialType } from '@nestjs/mapped-types';
import { CreatePermitRequirementDto } from './create-permit-requirement.dto';

export class UpdatePermitRequirementDto extends PartialType(
  CreatePermitRequirementDto,
) {}
