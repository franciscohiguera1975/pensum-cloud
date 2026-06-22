import { NotFoundException } from '@nestjs/common';
import { GetUniversityUseCase } from '../../../../../../apps/backend/src/modules/university/application/use-cases/get-university.use-case';
import { UpdateUniversityUseCase } from '../../../../../../apps/backend/src/modules/university/application/use-cases/update-university.use-case';
import { DeleteUniversityUseCase } from '../../../../../../apps/backend/src/modules/university/application/use-cases/delete-university.use-case';
import { ListUniversitiesUseCase } from '../../../../../../apps/backend/src/modules/university/application/use-cases/list-universities.use-case';
import { University } from '../../../../../../apps/backend/src/modules/university/domain/entities/university.entity';
import { IUniversityRepository } from '../../../../../../apps/backend/src/modules/university/domain/repositories/university.repository.interface';

const makeRepo = (): jest.Mocked<IUniversityRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  existsByCode: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeUniversity = () =>
  University.create({ tenantId: 'tid', name: 'UNAL', code: 'UN' });

describe('GetUniversityUseCase', () => {
  let repo: jest.Mocked<IUniversityRepository>;

  beforeEach(() => { repo = makeRepo(); });

  it('should return university when found', async () => {
    repo.findById.mockResolvedValue(makeUniversity());
    const result = await new GetUniversityUseCase(repo).execute('id', 'tid');
    expect(result.code).toBe('UN');
  });

  it('should throw NotFoundException when not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(new GetUniversityUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('ListUniversitiesUseCase', () => {
  let repo: jest.Mocked<IUniversityRepository>;

  beforeEach(() => { repo = makeRepo(); });

  it('should return all universities for tenant', async () => {
    repo.findAll.mockResolvedValue([makeUniversity(), makeUniversity()]);
    const result = await new ListUniversitiesUseCase(repo).execute('tid');
    expect(result).toHaveLength(2);
    expect(repo.findAll).toHaveBeenCalledWith('tid');
  });

  it('should return empty array when none exist', async () => {
    repo.findAll.mockResolvedValue([]);
    const result = await new ListUniversitiesUseCase(repo).execute('tid');
    expect(result).toEqual([]);
  });
});

describe('UpdateUniversityUseCase', () => {
  let repo: jest.Mocked<IUniversityRepository>;

  beforeEach(() => { repo = makeRepo(); });

  it('should update and return university', async () => {
    const uni = makeUniversity();
    repo.findById.mockResolvedValue(uni);
    const updated = University.create({ tenantId: 'tid', name: 'Updated', code: 'UN' });
    repo.update.mockResolvedValue(updated);

    const result = await new UpdateUniversityUseCase(repo).execute('id', 'tid', { name: 'Updated' });
    expect(result.name).toBe('Updated');
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      new UpdateUniversityUseCase(repo).execute('id', 'tid', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('DeleteUniversityUseCase', () => {
  let repo: jest.Mocked<IUniversityRepository>;

  beforeEach(() => { repo = makeRepo(); });

  it('should soft-delete university', async () => {
    const uni = makeUniversity();
    repo.findById.mockResolvedValue(uni);
    repo.update.mockResolvedValue(uni);

    await expect(
      new DeleteUniversityUseCase(repo).execute('id', 'tid'),
    ).resolves.toBeUndefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      new DeleteUniversityUseCase(repo).execute('id', 'tid'),
    ).rejects.toThrow(NotFoundException);
  });
});
