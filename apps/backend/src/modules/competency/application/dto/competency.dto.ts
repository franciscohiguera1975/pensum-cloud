import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCompetencyDto {
  @ApiProperty({ example: 'Critical Thinking' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'CT01' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCompetencyDto extends PartialType(CreateCompetencyDto) {}

export class CompetencyResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() code: string | null;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class AddCompetencyToSubjectDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  competencyId: string;
}
