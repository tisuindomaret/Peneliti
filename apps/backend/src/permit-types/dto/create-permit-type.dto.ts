import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  Min,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreatePermitTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @Min(1)
  validity_period_days: number;

  @IsString()
  @IsNotEmpty()
  numbering_pattern: string;

  @IsUUID()
  @IsOptional()
  pdf_template_id?: string;
}
