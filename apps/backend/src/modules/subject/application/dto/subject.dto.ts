import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Cálculo Diferencial' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'MAT101' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  credits!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  hoursTheory!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  hoursPractice!: number;

  @ApiPropertyOptional({ example: 'Introducción al cálculo' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSubjectDto extends PartialType(OmitType(CreateSubjectDto, ['code'] as const)) {}

export class MoveSubjectDto {
  @ApiProperty({ description: 'Target semester UUID', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  semesterId!: string;
}

export class ReorderSubjectDto {
  @ApiProperty({ description: 'Target semester UUID', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  semesterId!: string;

  @ApiProperty({ description: 'Target position index (0-based)', example: 2 })
  @IsInt()
  @Min(0)
  position!: number;
}

export class SubjectResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() semesterId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
  @ApiProperty() credits!: number;
  @ApiProperty() hoursTheory!: number;
  @ApiProperty() hoursPractice!: number;
  @ApiPropertyOptional() description!: string | null;
  @ApiProperty() position!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
