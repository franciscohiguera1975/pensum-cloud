import { NotFoundException } from '@nestjs/common';
import { DeactivateTenantUseCase } from '../../../../../../apps/backend/src/modules/tenant/application/use-cases/deactivate-tenant.use-case';
import { Tenant } from '../../../../../../apps/backend/src/modules/tenant/domain/entities/tenant.entity';
import { ITenantRepository } from '../../../../../../apps/backend/src/modules/tenant/domain/repositories/tenant.repository.interface';

const makeRepository = (): jest.Mocked<ITenantRepository> => ({
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  existsBySlug: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('DeactivateTenantUseCase', () => {
  let useCase: DeactivateTenantUseCase;
  let repo: jest.Mocked<ITenantRepository>;

  beforeEach(() => {
    repo = makeRepository();
    useCase = new DeactivateTenantUseCase(repo);
  });

  it('should deactivate an active tenant', async () => {
    const tenant = Tenant.create({ name: 'Demo U', slug: 'demo-u' });
    repo.findById.mockResolvedValue(tenant);

    const deactivated = Tenant.reconstitute({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: false,
      createdAt: tenant.createdAt,
      updatedAt: new Date(),
    });
    repo.update.mockResolvedValue(deactivated);

    const result = await useCase.execute(tenant.id.value);

    expect(repo.findById).toHaveBeenCalledWith(tenant.id.value);
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(result.isActive).toBe(false);
  });

  it('should throw NotFoundException when tenant not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should throw when tenant is already inactive', async () => {
    const tenant = Tenant.create({ name: 'Demo U', slug: 'demo-u' });
    tenant.deactivate();
    repo.findById.mockResolvedValue(tenant);

    await expect(useCase.execute(tenant.id.value)).rejects.toThrow(
      'Tenant is already inactive',
    );

    expect(repo.update).not.toHaveBeenCalled();
  });
});
