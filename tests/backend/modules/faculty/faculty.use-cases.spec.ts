import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  CreateFacultyUseCase,
  DeleteFacultyUseCase,
  GetFacultyUseCase,
  ListFacultiesUseCase,
  UpdateFacultyUseCase,
} from '../../../../apps/backend/src/modules/faculty/application/use-cases/faculty.use-cases';
import { Faculty } from '../../../../apps/backend/src/modules/faculty/domain/entities/faculty.entity';
import { IFacultyRepository } from '../../../../apps/backend/src/modules/faculty/domain/repositories/faculty.repository.interface';

const makeRepo = (): jest.Mocked<IFacultyRepository> => ({
  findById: jest.fn(),
  findAllByUniversity: jest.fn(),
  existsByCode: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeFaculty = () =>
  Faculty.create({ tenantId: 'tid', universityId: 'uid', name: 'Ing', code: 'FI' });

describe('CreateFacultyUseCase', () => {
  it('should create faculty when code is unique', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(false);
    const f = makeFaculty();
    repo.save.mockResolvedValue(f);

    const result = await new CreateFacultyUseCase(repo).execute('tid', 'uid', {
      name: 'Ing',
      code: 'FI',
    });

    expect(result.code).toBe('FI');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when code exists', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(true);

    await expect(
      new CreateFacultyUseCase(repo).execute('tid', 'uid', { name: 'X', code: 'FI' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('GetFacultyUseCase', () => {
  it('should return faculty when found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeFaculty());
    const result = await new GetFacultyUseCase(repo).execute('id', 'tid');
    expect(result.code).toBe('FI');
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new GetFacultyUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('ListFacultiesUseCase', () => {
  it('should list faculties by university', async () => {
    const repo = makeRepo();
    repo.findAllByUniversity.mockResolvedValue([makeFaculty(), makeFaculty()]);
    const result = await new ListFacultiesUseCase(repo).execute('uid', 'tid');
    expect(result).toHaveLength(2);
    expect(repo.findAllByUniversity).toHaveBeenCalledWith('uid', 'tid');
  });
});

describe('UpdateFacultyUseCase', () => {
  it('should update faculty name', async () => {
    const repo = makeRepo();
    const f = makeFaculty();
    repo.findById.mockResolvedValue(f);
    repo.update.mockResolvedValue(f);

    await expect(
      new UpdateFacultyUseCase(repo).execute('id', 'tid', { name: 'Nueva' }),
    ).resolves.toBeDefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(
      new UpdateFacultyUseCase(repo).execute('id', 'tid', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('DeleteFacultyUseCase', () => {
  it('should soft-delete faculty', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeFaculty());
    repo.update.mockResolvedValue(makeFaculty());

    await expect(
      new DeleteFacultyUseCase(repo).execute('id', 'tid'),
    ).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new DeleteFacultyUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});
