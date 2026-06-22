import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { University } from '../../domain/entities/university.entity';

export class UniversityResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
  @ApiPropertyOptional({ nullable: true }) country!: string | null;
  @ApiPropertyOptional({ nullable: true }) website!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromDomain(u: University): UniversityResponseDto {
    const dto = new UniversityResponseDto();
    dto.id = u.id;
    dto.tenantId = u.tenantId;
    dto.name = u.name;
    dto.code = u.code;
    dto.country = u.country;
    dto.website = u.website;
    dto.createdAt = u.createdAt;
    dto.updatedAt = u.updatedAt;
    return dto;
  }
}
