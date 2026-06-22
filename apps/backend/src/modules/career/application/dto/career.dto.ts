import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Career } from '../../domain/entities/career.entity';

export class CreateCareerDto {
  @ApiProperty({ example: 'Ingeniería de Sistemas', maxLength: 255 })
  @IsString() @IsNotEmpty() @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'IS', maxLength: 20 })
  @IsString() @IsNotEmpty() @MaxLength(20)
  code!: string;

  @ApiPropertyOptional({ example: 'Carrera de pregrado en Ingeniería de Sistemas' })
  @IsString() @IsOptional() @MaxLength(500)
  description?: string;
}

export class UpdateCareerDto {
  @ApiPropertyOptional({ example: 'Ingeniería de Software', maxLength: 255 })
  @IsString() @IsNotEmpty() @IsOptional() @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString() @IsOptional() @MaxLength(500)
  description?: string | null;
}

export class CareerResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() facultyId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromDomain(c: Career): CareerResponseDto {
    const dto = new CareerResponseDto();
    dto.id = c.id;
    dto.tenantId = c.tenantId;
    dto.facultyId = c.facultyId;
    dto.name = c.name;
    dto.code = c.code;
    dto.description = c.description;
    dto.createdAt = c.createdAt;
    dto.updatedAt = c.updatedAt;
    return dto;
  }
}
