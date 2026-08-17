import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreatePermitRequirementDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  is_mandatory: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  accepted_formats: string[];

  @IsInt()
  @Min(1)
  max_size_mb: number;
}
