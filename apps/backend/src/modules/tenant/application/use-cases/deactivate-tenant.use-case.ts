import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';
import { TenantResponseDto } from '../dto/tenant-response.dto';

@Injectable()
export class DeactivateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    tenant.deactivate();
    const updated = await this.tenantRepository.update(tenant);

    return TenantResponseDto.fromDomain(updated);
  }
}
