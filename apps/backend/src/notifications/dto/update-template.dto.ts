import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateNotificationTemplateDto {
  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  bodyTemplate?: string;

  @IsArray()
  @IsOptional()
  internalRecipients?: string[];
}
