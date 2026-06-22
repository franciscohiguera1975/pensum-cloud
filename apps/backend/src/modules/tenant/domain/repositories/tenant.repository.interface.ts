import { Tenant } from '../entities/tenant.entity';

export const TENANT_REPOSITORY = Symbol('ITenantRepository');

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findAll(onlyActive?: boolean): Promise<Tenant[]>;
  existsBySlug(slug: string): Promise<boolean>;
  save(tenant: Tenant): Promise<Tenant>;
  update(tenant: Tenant): Promise<Tenant>;
}
