import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { Tenant } from '../../domain/entities/tenant.entity';
import { ITenantRepository } from '../../domain/repositories/tenant.repository.interface';
import { TenantMapper } from '../mappers/tenant.mapper';

@Injectable()
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    return raw ? TenantMapper.toDomain(raw) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });
    return raw ? TenantMapper.toDomain(raw) : null;
  }

  async findAll(onlyActive = true): Promise<Tenant[]> {
    const rows = await this.prisma.tenant.findMany({
      where: {
        deletedAt: null,
        ...(onlyActive ? { isActive: true } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(TenantMapper.toDomain);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: { slug, deletedAt: null },
    });
    return count > 0;
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const data = TenantMapper.toPersistence(tenant);
    const raw = await this.prisma.tenant.create({ data });
    return TenantMapper.toDomain(raw);
  }

  async update(tenant: Tenant): Promise<Tenant> {
    const { id, ...data } = TenantMapper.toPersistence(tenant);
    const raw = await this.prisma.tenant.update({
      where: { id },
      data,
    });
    return TenantMapper.toDomain(raw);
  }
}
