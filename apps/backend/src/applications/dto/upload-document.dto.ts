import { IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @IsUUID()
  requirement_id: string;
}
