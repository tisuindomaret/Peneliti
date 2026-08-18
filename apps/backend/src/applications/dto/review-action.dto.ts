import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ActionItemDto {
  @IsString()
  field: string; // e.g., 'document_123', 'objective'

  @IsString()
  instruction: string;
}

export class RequestRevisionDto {
  @IsString()
  reason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionItemDto)
  actionList: ActionItemDto[];
}

export class ForwardApplicationDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class ApproveApplicationDto {
  @IsOptional()
  @IsString()
  conditions?: string;
}

export class RejectApplicationDto {
  @IsString()
  reason: string;
}

export class AddReviewNoteDto {
  @IsString()
  note: string;
}
