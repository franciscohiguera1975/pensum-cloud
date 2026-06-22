import { ListTenantsUseCase } from '../../../../../../apps/backend/src/modules/tenant/application/use-cases/list-tenants.use-case';
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

describe('ListTenantsUseCase', () => {
  let useCase: ListTenantsUseCase;
  let repo: jest.Mocked<ITenantRepository>;

  beforeEach(() => {
    repo = makeRepository();
    useCase = new ListTenantsUseCase(repo);
  });

  it('should return list of active tenants by default', async () => {
    const tenants = [
      Tenant.create({ name: 'U1', slug: 'u1' }),
      Tenant.create({ name: 'U2', slug: 'u2' }),
    ];
    repo.findAll.mockResolvedValue(tenants);

    const result = await useCase.execute();

    expect(repo.findAll).toHaveBeenCalledWith(true);
    expect(result).toHaveLength(2);
  });

  it('should pass onlyActive=false when requested', async () => {
    repo.findAll.mockResolvedValue([]);

    await useCase.execute(false);

    expect(repo.findAll).toHaveBeenCalledWith(false);
  });

  it('should return empty array when no tenants', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
