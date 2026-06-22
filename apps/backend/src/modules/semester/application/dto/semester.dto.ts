import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSemesterDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  number!: number;

  @ApiPropertyOptional({ example: 'Primer Semestre' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class UpdateSemesterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class SemesterResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() curriculumId!: string;
  @ApiProperty() number!: number;
  @ApiPropertyOptional() name!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
