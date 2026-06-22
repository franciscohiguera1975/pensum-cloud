import { ConflictException } from '@nestjs/common';
import { CreateUniversityUseCase } from '../../../../../../apps/backend/src/modules/university/application/use-cases/create-university.use-case';
import { University } from '../../../../../../apps/backend/src/modules/university/domain/entities/university.entity';
import { IUniversityRepository } from '../../../../../../apps/backend/src/modules/university/domain/repositories/university.repository.interface';

const makeRepo = (): jest.Mocked<IUniversityRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  existsByCode: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('CreateUniversityUseCase', () => {
  let useCase: CreateUniversityUseCase;
  let repo: jest.Mocked<IUniversityRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new CreateUniversityUseCase(repo);
  });

  it('should create and return a university', async () => {
    repo.existsByCode.mockResolvedValue(false);
    const saved = University.create({ tenantId: 'tid', name: 'UNAL', code: 'UN' });
    repo.save.mockResolvedValue(saved);

    const result = await useCase.execute('tid', { name: 'UNAL', code: 'UN' });

    expect(repo.existsByCode).toHaveBeenCalledWith('UN', 'tid');
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.code).toBe('UN');
  });

  it('should throw ConflictException when code already exists', async () => {
    repo.existsByCode.mockResolvedValue(true);

    await expect(
      useCase.execute('tid', { name: 'Otra', code: 'UN' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
