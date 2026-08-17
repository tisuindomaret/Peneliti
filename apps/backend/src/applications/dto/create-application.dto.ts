import { IsUUID, IsOptional } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  permit_type_id: string;

  @IsOptional()
  @IsUUID()
  institution_id?: string;
}
