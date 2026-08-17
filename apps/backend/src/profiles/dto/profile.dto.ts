import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  identityNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  affiliation?: string;

  @IsUUID()
  @IsOptional()
  institutionId?: string;
}
