import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  CreateSemesterUseCase,
  DeleteSemesterUseCase,
  GetSemesterUseCase,
  ListSemestersUseCase,
  UpdateSemesterUseCase,
} from '../../../../apps/backend/src/modules/semester/application/use-cases/semester.use-cases';
import { Semester } from '../../../../apps/backend/src/modules/semester/domain/entities/semester.entity';
import { ISemesterRepository } from '../../../../apps/backend/src/modules/semester/domain/repositories/semester.repository.interface';

const makeRepo = (): jest.Mocked<ISemesterRepository> => ({
  findById: jest.fn(),
  findAllByCurriculum: jest.fn(),
  existsByNumber: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeSemester = () =>
  Semester.create({ tenantId: 'tid', curriculumId: 'cuid', number: 1, name: 'Primer Semestre' });

describe('CreateSemesterUseCase', () => {
  it('should create when number is unique', async () => {
    const repo = makeRepo();
    repo.existsByNumber.mockResolvedValue(false);
    repo.save.mockResolvedValue(makeSemester());

    const result = await new CreateSemesterUseCase(repo).execute('tid', 'cuid', { number: 1 });
    expect(result.number).toBe(1);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when number exists', async () => {
    const repo = makeRepo();
    repo.existsByNumber.mockResolvedValue(true);

    await expect(
      new CreateSemesterUseCase(repo).execute('tid', 'cuid', { number: 1 }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('GetSemesterUseCase', () => {
  it('should return semester when found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeSemester());
    const result = await new GetSemesterUseCase(repo).execute('id', 'tid');
    expect(result.number).toBe(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new GetSemesterUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('ListSemestersUseCase', () => {
  it('should list semesters by curriculum', async () => {
    const repo = makeRepo();
    repo.findAllByCurriculum.mockResolvedValue([makeSemester(), makeSemester()]);
    const result = await new ListSemestersUseCase(repo).execute('cuid', 'tid');
    expect(result).toHaveLength(2);
    expect(repo.findAllByCurriculum).toHaveBeenCalledWith('cuid', 'tid');
  });
});

describe('UpdateSemesterUseCase', () => {
  it('should update semester', async () => {
    const repo = makeRepo();
    const s = makeSemester();
    repo.findById.mockResolvedValue(s);
    repo.update.mockResolvedValue(s);

    await expect(
      new UpdateSemesterUseCase(repo).execute('id', 'tid', { name: 'Nuevo Nombre' }),
    ).resolves.toBeDefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(
      new UpdateSemesterUseCase(repo).execute('id', 'tid', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('DeleteSemesterUseCase', () => {
  it('should soft-delete semester', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeSemester());
    repo.update.mockResolvedValue(makeSemester());

    await expect(new DeleteSemesterUseCase(repo).execute('id', 'tid')).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new DeleteSemesterUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('Semester entity', () => {
  it('should throw when soft-deleting twice', () => {
    const s = makeSemester();
    s.softDelete();
    expect(() => s.softDelete()).toThrow('Semester is already deleted');
  });
});
