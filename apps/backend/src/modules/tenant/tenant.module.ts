import { Module } from '@nestjs/common';
import { CreateTenantUseCase } from './application/use-cases/create-tenant.use-case';
import { DeactivateTenantUseCase } from './application/use-cases/deactivate-tenant.use-case';
import { GetTenantBySlugUseCase } from './application/use-cases/get-tenant-by-slug.use-case';
import { ListTenantsUseCase } from './application/use-cases/list-tenants.use-case';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository.interface';
import { PrismaTenantRepository } from './infrastructure/repositories/prisma-tenant.repository';
import { TenantsController } from './presentation/controllers/tenants.controller';

const USE_CASES = [
  CreateTenantUseCase,
  GetTenantBySlugUseCase,
  ListTenantsUseCase,
  DeactivateTenantUseCase,
];

@Module({
  controllers: [TenantsController],
  providers: [
    ...USE_CASES,
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository,
    },
  ],
  exports: [...USE_CASES],
})
export class TenantModule {}
