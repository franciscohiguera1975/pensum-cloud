import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../domain/entities/tenant.entity';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';

@Injectable()
export class CreateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(dto: CreateTenantDto): Promise<TenantResponseDto> {
    const slugExists = await this.tenantRepository.existsBySlug(dto.slug);
    if (slugExists) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    const tenant = Tenant.create({ name: dto.name, slug: dto.slug });
    const saved = await this.tenantRepository.save(tenant);

    return TenantResponseDto.fromDomain(saved);
  }
}
