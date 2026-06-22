import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  CreateSubjectUseCase,
  DeleteSubjectUseCase,
  GetSubjectUseCase,
  ListSubjectsUseCase,
  UpdateSubjectUseCase,
} from '../../../../apps/backend/src/modules/subject/application/use-cases/subject.use-cases';
import { Subject } from '../../../../apps/backend/src/modules/subject/domain/entities/subject.entity';
import { ISubjectRepository } from '../../../../apps/backend/src/modules/subject/domain/repositories/subject.repository.interface';

const makeRepo = (): jest.Mocked<ISubjectRepository> => ({
  findById: jest.fn(),
  findAllBySemester: jest.fn(),
  existsByCode: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const makeSubject = () =>
  Subject.create({
    tenantId: 'tid',
    semesterId: 'sid',
    name: 'Cálculo Diferencial',
    code: 'MAT101',
    credits: 3,
    hoursTheory: 2,
    hoursPractice: 2,
  });

describe('CreateSubjectUseCase', () => {
  it('should create when code is unique', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(false);
    repo.save.mockResolvedValue(makeSubject());

    const result = await new CreateSubjectUseCase(repo).execute('tid', 'sid', {
      name: 'Cálculo Diferencial',
      code: 'MAT101',
      credits: 3,
      hoursTheory: 2,
      hoursPractice: 2,
    });

    expect(result.code).toBe('MAT101');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when code exists', async () => {
    const repo = makeRepo();
    repo.existsByCode.mockResolvedValue(true);

    await expect(
      new CreateSubjectUseCase(repo).execute('tid', 'sid', {
        name: 'X',
        code: 'MAT101',
        credits: 3,
        hoursTheory: 2,
        hoursPractice: 2,
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('GetSubjectUseCase', () => {
  it('should return subject when found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeSubject());
    const result = await new GetSubjectUseCase(repo).execute('id', 'tid');
    expect(result.code).toBe('MAT101');
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new GetSubjectUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('ListSubjectsUseCase', () => {
  it('should list subjects by semester', async () => {
    const repo = makeRepo();
    repo.findAllBySemester.mockResolvedValue([makeSubject(), makeSubject()]);
    const result = await new ListSubjectsUseCase(repo).execute('sid', 'tid');
    expect(result).toHaveLength(2);
    expect(repo.findAllBySemester).toHaveBeenCalledWith('sid', 'tid');
  });
});

describe('UpdateSubjectUseCase', () => {
  it('should update subject', async () => {
    const repo = makeRepo();
    const s = makeSubject();
    repo.findById.mockResolvedValue(s);
    repo.update.mockResolvedValue(s);

    await expect(
      new UpdateSubjectUseCase(repo).execute('id', 'tid', { name: 'Nuevo Nombre', credits: 4 }),
    ).resolves.toBeDefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(
      new UpdateSubjectUseCase(repo).execute('id', 'tid', { name: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('DeleteSubjectUseCase', () => {
  it('should soft-delete subject', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeSubject());
    repo.update.mockResolvedValue(makeSubject());

    await expect(new DeleteSubjectUseCase(repo).execute('id', 'tid')).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    await expect(new DeleteSubjectUseCase(repo).execute('id', 'tid')).rejects.toThrow(NotFoundException);
  });
});

describe('Subject entity', () => {
  it('should uppercase code on create', () => {
    const s = Subject.create({
      tenantId: 't',
      semesterId: 's',
      name: 'Test',
      code: 'mat101',
      credits: 3,
      hoursTheory: 2,
      hoursPractice: 1,
    });
    expect(s.code).toBe('MAT101');
  });

  it('should throw when soft-deleting twice', () => {
    const s = makeSubject();
    s.softDelete();
    expect(() => s.softDelete()).toThrow('Subject is already deleted');
  });
});
