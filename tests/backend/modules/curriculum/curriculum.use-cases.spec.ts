import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  ActivateCurriculumUseCase,
  ArchiveCurriculumUseCase,
  CreateCurriculumUseCase,
  DeleteCurriculumUseCase,
  GetCurriculumUseCase,
  ListCurriculaUseCase,
  UpdateCurriculumUseCase,
} from '../../../../apps/backend/src/modules/curriculum/application/use-cases/curriculum.use-cases';
import {
  Curriculum,
  CurriculumStatus,
} from '../../../../apps/backend/src/modules/curriculum/domain/entities/curriculum.entity';
import { ICurriculumRepository } from '../../../../apps/backend/src/modules/curriculum/domain/repositories/curriculum.repository.interface';

const makeRepo = (): jest.Mocked<ICurriculumRepository> => ({
  findById: jest.fn(),
  findAllByCareer: jest.fn(),
  existsByVersion: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeCurriculum = () =>
  Curriculum.create({
    tenantId: 'tid',
    careerId: 'cid',
    version: 1,
    name: 'Plan 2024',
    description: 'Descripción',
  });

describe('CreateCurriculumUseCase', () => {
  it('should create when version is unique', async () => {
    const repo = makeRepo();
    repo.existsByVersion.mockResolvedValue(false);
    repo.save.mockResolvedValue(makeCurriculum());

    const result = await new CreateCurriculumUseCase(repo).execute('tid', 'cid', {
      version: 1,
      name: 'Plan 2024',
    });

    expect(result.version).toBe(1);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when version exists', async () => {
    const repo = makeRepo();
    repo.existsByVersion.mockResolvedValue(true);

    await expect(
      new CreateCurriculumUseCase(repo).execute('tid', 'cid', { version: 1, name: 'X' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('GetCurriculumUseCase', () => {
  it('should return curriculum when found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeCurriculum());
    const result = await new GetCurriculumUseCase(repo).execute('id', 'tid');
    expect(result.name).toBe('Plan 2024');
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new GetCurriculumUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('ListCurriculaUseCase', () => {
  it('should list curricula by career', async () => {
    const repo = makeRepo();
    repo.findAllByCareer.mockResolvedValue([makeCurriculum(), makeCurriculum()]);
    const result = await new ListCurriculaUseCase(repo).execute('cid', 'tid');
    expect(result).toHaveLength(2);
    expect(repo.findAllByCareer).toHaveBeenCalledWith('cid', 'tid');
  });
});

describe('UpdateCurriculumUseCase', () => {
  it('should update curriculum', async () => {
    const repo = makeRepo();
    const c = makeCurriculum();
    repo.findById.mockResolvedValue(c);
    repo.update.mockResolvedValue(c);

    await expect(
      new UpdateCurriculumUseCase(repo).execute('id', 'tid', { name: 'Plan Actualizado' }),
    ).resolves.toBeDefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(
      new UpdateCurriculumUseCase(repo).execute('id', 'tid', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ActivateCurriculumUseCase', () => {
  it('should activate a DRAFT curriculum', async () => {
    const repo = makeRepo();
    const c = makeCurriculum();
    repo.findById.mockResolvedValue(c);
    repo.update.mockResolvedValue(c);

    const result = await new ActivateCurriculumUseCase(repo).execute('id', 'tid');
    expect(result).toBeDefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new ActivateCurriculumUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('ArchiveCurriculumUseCase', () => {
  it('should archive a curriculum', async () => {
    const repo = makeRepo();
    const c = makeCurriculum();
    repo.findById.mockResolvedValue(c);
    repo.update.mockResolvedValue(c);

    await expect(new ArchiveCurriculumUseCase(repo).execute('id', 'tid')).resolves.toBeDefined();
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new ArchiveCurriculumUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('DeleteCurriculumUseCase', () => {
  it('should soft-delete curriculum', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeCurriculum());
    repo.update.mockResolvedValue(makeCurriculum());

    await expect(new DeleteCurriculumUseCase(repo).execute('id', 'tid')).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new DeleteCurriculumUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('Curriculum entity', () => {
  it('should start in DRAFT status', () => {
    const c = makeCurriculum();
    expect(c.status).toBe(CurriculumStatus.DRAFT);
  });

  it('should activate from DRAFT', () => {
    const c = makeCurriculum();
    c.activate();
    expect(c.status).toBe(CurriculumStatus.ACTIVE);
  });

  it('should archive a curriculum', () => {
    const c = makeCurriculum();
    c.archive();
    expect(c.status).toBe(CurriculumStatus.ARCHIVED);
  });

  it('should throw when archiving an already archived curriculum', () => {
    const c = makeCurriculum();
    c.archive();
    expect(() => c.archive()).toThrow('Curriculum is already archived');
  });

  it('should throw when activating an archived curriculum', () => {
    const c = makeCurriculum();
    c.archive();
    expect(() => c.activate()).toThrow('Cannot activate an archived curriculum');
  });

  it('should throw when soft-deleting twice', () => {
    const c = makeCurriculum();
    c.softDelete();
    expect(() => c.softDelete()).toThrow('Curriculum is already deleted');
  });
});
