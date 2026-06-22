import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';

export class CreateLearningOutcomeDto {
  @ApiProperty({ example: 'Student can analyze complex systems' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'LO01' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  competencyId?: string;
}

export class UpdateLearningOutcomeDto extends PartialType(
  OmitType(CreateLearningOutcomeDto, ['subjectId', 'competencyId'] as const),
) {}

export class LearningOutcomeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional() code: string | null;
  @ApiPropertyOptional() subjectId: string | null;
  @ApiPropertyOptional() competencyId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
