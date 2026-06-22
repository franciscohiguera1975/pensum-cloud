import { Tenant as PrismaTenant } from '@prisma/client';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantId } from '../../domain/value-objects/tenant-id.value-object';
import { TenantSlug } from '../../domain/value-objects/tenant-slug.value-object';

export class TenantMapper {
  static toDomain(raw: PrismaTenant): Tenant {
    return Tenant.reconstitute({
      id: TenantId.fromString(raw.id),
      name: raw.name,
      slug: TenantSlug.fromString(raw.slug),
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(
    tenant: Tenant,
  ): Pick<PrismaTenant, 'id' | 'name' | 'slug' | 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      id: tenant.id.value,
      name: tenant.name,
      slug: tenant.slug.value,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      deletedAt: tenant.deletedAt ?? null,
    };
  }
}
