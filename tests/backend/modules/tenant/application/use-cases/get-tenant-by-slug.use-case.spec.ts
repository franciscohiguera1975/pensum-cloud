import { NotFoundException } from '@nestjs/common';
import { GetTenantBySlugUseCase } from '../../../../../../apps/backend/src/modules/tenant/application/use-cases/get-tenant-by-slug.use-case';
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

describe('GetTenantBySlugUseCase', () => {
  let useCase: GetTenantBySlugUseCase;
  let repo: jest.Mocked<ITenantRepository>;

  beforeEach(() => {
    repo = makeRepository();
    useCase = new GetTenantBySlugUseCase(repo);
  });

  it('should return tenant when found', async () => {
    const tenant = Tenant.create({ name: 'Demo U', slug: 'demo-u' });
    repo.findBySlug.mockResolvedValue(tenant);

    const result = await useCase.execute('demo-u');

    expect(repo.findBySlug).toHaveBeenCalledWith('demo-u');
    expect(result.slug).toBe('demo-u');
  });

  it('should throw NotFoundException when not found', async () => {
    repo.findBySlug.mockResolvedValue(null);

    await expect(useCase.execute('not-exists')).rejects.toThrow(
      NotFoundException,
    );
  });
});
