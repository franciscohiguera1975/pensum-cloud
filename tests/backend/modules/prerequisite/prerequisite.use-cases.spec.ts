import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  AddPrerequisiteUseCase,
  ListPrerequisitesUseCase,
  RemovePrerequisiteUseCase,
} from '../../../../apps/backend/src/modules/prerequisite/application/use-cases/prerequisite.use-cases';
import { Prerequisite } from '../../../../apps/backend/src/modules/prerequisite/domain/entities/prerequisite.entity';
import { IPrerequisiteRepository } from '../../../../apps/backend/src/modules/prerequisite/domain/repositories/prerequisite.repository.interface';

const makeRepo = (): jest.Mocked<IPrerequisiteRepository> => ({
  findBySubject: jest.fn(),
  exists: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makePrerequisite = () =>
  Prerequisite.create({ subjectId: 'sub1', requiresId: 'sub2', tenantId: 'tid' });

describe('AddPrerequisiteUseCase', () => {
  it('should add prerequisite when it does not exist', async () => {
    const repo = makeRepo();
    repo.exists.mockResolvedValue(false);
    repo.save.mockResolvedValue(makePrerequisite());

    const result = await new AddPrerequisiteUseCase(repo).execute('tid', 'sub1', { requiresId: 'sub2' });
    expect(result.subjectId).toBe('sub1');
    expect(result.requiresId).toBe('sub2');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when relationship already exists', async () => {
    const repo = makeRepo();
    repo.exists.mockResolvedValue(true);

    await expect(
      new AddPrerequisiteUseCase(repo).execute('tid', 'sub1', { requiresId: 'sub2' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('RemovePrerequisiteUseCase', () => {
  it('should remove prerequisite when it exists', async () => {
    const repo = makeRepo();
    repo.exists.mockResolvedValue(true);
    repo.delete.mockResolvedValue(undefined);

    await expect(
      new RemovePrerequisiteUseCase(repo).execute('tid', 'sub1', 'sub2'),
    ).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('sub1', 'sub2', 'tid');
  });

  it('should throw NotFoundException when relationship does not exist', async () => {
    const repo = makeRepo();
    repo.exists.mockResolvedValue(false);

    await expect(
      new RemovePrerequisiteUseCase(repo).execute('tid', 'sub1', 'sub2'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ListPrerequisitesUseCase', () => {
  it('should list prerequisites for a subject', async () => {
    const repo = makeRepo();
    repo.findBySubject.mockResolvedValue([makePrerequisite()]);

    const result = await new ListPrerequisitesUseCase(repo).execute('sub1', 'tid');
    expect(result).toHaveLength(1);
    expect(repo.findBySubject).toHaveBeenCalledWith('sub1', 'tid');
  });
});

describe('Prerequisite entity', () => {
  it('should throw when subjectId equals requiresId', () => {
    expect(() =>
      Prerequisite.create({ subjectId: 'same', requiresId: 'same', tenantId: 'tid' }),
    ).toThrow('A subject cannot be its own prerequisite');
  });

  it('should create valid prerequisite', () => {
    const p = makePrerequisite();
    expect(p.subjectId).toBe('sub1');
    expect(p.requiresId).toBe('sub2');
    expect(p.tenantId).toBe('tid');
  });
});
