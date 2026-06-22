import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '../../domain/entities/tenant.entity';

export class TenantResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Universidad Nacional' })
  name!: string;

  @ApiProperty({ example: 'uni-nacional' })
  slug!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromDomain(tenant: Tenant): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = tenant.id.value;
    dto.name = tenant.name;
    dto.slug = tenant.slug.value;
    dto.isActive = tenant.isActive;
    dto.createdAt = tenant.createdAt;
    dto.updatedAt = tenant.updatedAt;
    return dto;
  }
}
