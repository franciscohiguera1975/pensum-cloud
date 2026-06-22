import { ConflictException } from '@nestjs/common';
import { CreateTenantUseCase } from '../../../../../../apps/backend/src/modules/tenant/application/use-cases/create-tenant.use-case';
import { Tenant } from '../../../../../../apps/backend/src/modules/tenant/domain/entities/tenant.entity';
import { ITenantRepository } from '../../../../../../apps/backend/src/modules/tenant/domain/repositories/tenant.repository.interface';

const makeTenant = () =>
  Tenant.create({ name: 'Universidad Nacional', slug: 'uni-nacional' });

const makeRepository = (): jest.Mocked<ITenantRepository> => ({
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  existsBySlug: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;
  let repo: jest.Mocked<ITenantRepository>;

  beforeEach(() => {
    repo = makeRepository();
    useCase = new CreateTenantUseCase(repo);
  });

  it('should create and return a tenant', async () => {
    const tenant = makeTenant();
    repo.existsBySlug.mockResolvedValue(false);
    repo.save.mockResolvedValue(tenant);

    const result = await useCase.execute({
      name: 'Universidad Nacional',
      slug: 'uni-nacional',
    });

    expect(repo.existsBySlug).toHaveBeenCalledWith('uni-nacional');
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Universidad Nacional');
    expect(result.slug).toBe('uni-nacional');
    expect(result.isActive).toBe(true);
  });

  it('should throw ConflictException when slug is taken', async () => {
    repo.existsBySlug.mockResolvedValue(true);

    await expect(
      useCase.execute({ name: 'Otra U', slug: 'uni-nacional' }),
    ).rejects.toThrow(ConflictException);

    expect(repo.save).not.toHaveBeenCalled();
  });
});
