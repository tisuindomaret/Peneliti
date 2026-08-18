import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentReviewStatus } from '../entities/application-document.entity';

export class ReviewDocumentItemDto {
  @IsString()
  documentId: string;

  @IsEnum(DocumentReviewStatus)
  status: DocumentReviewStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ReviewApplicationDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDocumentItemDto)
  documentReviews?: ReviewDocumentItemDto[];
}
