import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Faculty } from '../../domain/entities/faculty.entity';

export class CreateFacultyDto {
  @ApiProperty({ example: 'Facultad de Ingeniería', maxLength: 255 })
  @IsString() @IsNotEmpty() @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'FI', maxLength: 20 })
  @IsString() @IsNotEmpty() @MaxLength(20)
  code!: string;
}

export class UpdateFacultyDto {
  @ApiPropertyOptional({ example: 'Facultad de Ciencias', maxLength: 255 })
  @IsString() @IsNotEmpty() @IsOptional() @MaxLength(255)
  name?: string;
}

export class FacultyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() universityId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromDomain(f: Faculty): FacultyResponseDto {
    const dto = new FacultyResponseDto();
    dto.id = f.id;
    dto.tenantId = f.tenantId;
    dto.universityId = f.universityId;
    dto.name = f.name;
    dto.code = f.code;
    dto.createdAt = f.createdAt;
    dto.updatedAt = f.updatedAt;
    return dto;
  }
}
