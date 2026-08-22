import { IsOptional, IsString } from 'class-validator';

export class RevisePermitDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
