import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  field_topic?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  period_start?: string;

  @IsOptional()
  @IsDateString()
  period_end?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  method_summary?: string;

  @IsOptional()
  @IsString()
  principal_investigator?: string;

  @IsOptional()
  @IsArray()
  team_members?: Record<string, unknown>[];
}
