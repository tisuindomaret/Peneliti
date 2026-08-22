import { IsOptional, IsString } from 'class-validator';

export class CancelPermitDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
