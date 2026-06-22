import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { CurriculumStatus } from '../../domain/entities/curriculum.entity';

export class CreateCurriculumDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  version!: string;

  @ApiProperty({ example: 'Plan de estudios 2024' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Descripción del plan' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCurriculumDto extends PartialType(CreateCurriculumDto) {}

export class CurriculumResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() careerId!: string;
  @ApiProperty() version!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description!: string | null;
  @ApiProperty({ enum: CurriculumStatus }) status!: CurriculumStatus;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
