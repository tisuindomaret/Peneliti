import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  contact: string;

  @IsString()
  @IsNotEmpty()
  responsibleOfficer: string;

  @IsUUID()
  @IsOptional()
  legalDocumentFileId?: string;
}
