import { Inject, Injectable } from '@nestjs/common';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';
import { TenantResponseDto } from '../dto/tenant-response.dto';

@Injectable()
export class ListTenantsUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(onlyActive = true): Promise<TenantResponseDto[]> {
    const tenants = await this.tenantRepository.findAll(onlyActive);
    return tenants.map(TenantResponseDto.fromDomain);
  }
}
