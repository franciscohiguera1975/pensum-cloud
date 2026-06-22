import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  CreateCareerUseCase,
  DeleteCareerUseCase,
  GetCareerUseCase,
  ListCareersUseCase,
  UpdateCareerUseCase,
} from '../../../../apps/backend/src/modules/career/application/use-cases/career.use-cases';
import { Career } from '../../../../apps/backend/src/modules/career/domain/entities/career.entity';
import { ICareerRepository } from '../../../../apps/backend/src/modules/career/domain/repositories/career.repository.interface';

const makeRepo = (): jest.Mocked<ICareerRepository> => ({
  findById: jest.fn(),
  findAllByFaculty: jest.fn(),
  existsByCode: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeCareer = () =>
  Career.create({
    tenantId: 'tid',
    facultyId: 'fid',
    name: 'Ingeniería de Sistemas',
    code: 'IS',
    description: 'Carrera de pregrado',
  });

describe('CreateCareerUseCase', () => {
  it('should create career when code is unique', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(false);
    repo.save.mockResolvedValue(makeCareer());

    const result = await new CreateCareerUseCase(repo).execute('tid', 'fid', {
      name: 'Ingeniería de Sistemas',
      code: 'IS',
    });

    expect(result.code).toBe('IS');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when code exists', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(true);

    await expect(
      new CreateCareerUseCase(repo).execute('tid', 'fid', { name: 'X', code: 'IS' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('GetCareerUseCase', () => {
  it('should return career when found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeCareer());
    const result = await new GetCareerUseCase(repo).execute('id', 'tid');
    expect(result.code).toBe('IS');
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new GetCareerUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('ListCareersUseCase', () => {
  it('should list careers by faculty', async () => {
    const repo = makeRepo();
    repo.findAllByFaculty.mockResolvedValue([makeCareer(), makeCareer()]);
    const result = await new ListCareersUseCase(repo).execute('fid', 'tid');
    expect(result).toHaveLength(2);
    expect(repo.findAllByFaculty).toHaveBeenCalledWith('fid', 'tid');
  });
});

describe('UpdateCareerUseCase', () => {
  it('should update career', async () => {
    const repo = makeRepo();
    const c = makeCareer();
    repo.findById.mockResolvedValue(c);
    repo.update.mockResolvedValue(c);

    await expect(
      new UpdateCareerUseCase(repo).execute('id', 'tid', { name: 'Nueva Carrera' }),
    ).resolves.toBeDefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(
      new UpdateCareerUseCase(repo).execute('id', 'tid', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('DeleteCareerUseCase', () => {
  it('should soft-delete career', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeCareer());
    repo.update.mockResolvedValue(makeCareer());

    await expect(
      new DeleteCareerUseCase(repo).execute('id', 'tid'),
    ).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new DeleteCareerUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('Career entity', () => {
  it('should uppercase code on create', () => {
    const c = Career.create({ tenantId: 't', facultyId: 'f', name: 'Test', code: 'is' });
    expect(c.code).toBe('IS');
  });

  it('should throw when already deleted', () => {
    const c = makeCareer();
    c.softDelete();
    expect(() => c.softDelete()).toThrow('Career is already deleted');
  });
});
