import { NotFoundException } from '@nestjs/common';
import { LearningOutcome } from '../../../../apps/backend/src/modules/learning-outcome/domain/entities/learning-outcome.entity';
import {
  CreateLearningOutcomeUseCase,
  GetLearningOutcomeUseCase,
  ListLearningOutcomesBySubjectUseCase,
  ListLearningOutcomesByCompetencyUseCase,
  UpdateLearningOutcomeUseCase,
  DeleteLearningOutcomeUseCase,
} from '../../../../apps/backend/src/modules/learning-outcome/application/use-cases/learning-outcome.use-cases';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1';

function makeLO(overrides: Partial<Parameters<typeof LearningOutcome.create>[0]> = {}) {
  return LearningOutcome.create({
    id: 'lo-1',
    tenantId,
    description: 'Student can analyze systems',
    code: 'LO01',
    subjectId: 'sub-1',
    ...overrides,
  });
}

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findById: jest.fn(),
    findBySubject: jest.fn(),
    findByCompetency: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

// ── CreateLearningOutcomeUseCase ──────────────────────────────────────────────

describe('CreateLearningOutcomeUseCase', () => {
  it('creates and saves a learning outcome', async () => {
    const repo = makeRepo({ save: jest.fn() });
    const result = await new CreateLearningOutcomeUseCase(repo as any).execute(
      { description: 'Student can analyze', code: 'LO01', subjectId: 'sub-1' },
      tenantId,
    );
    expect(result.description).toBe('Student can analyze');
    expect(result.code).toBe('LO01');
    expect(result.subjectId).toBe('sub-1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('uppercases the code', async () => {
    const repo = makeRepo({ save: jest.fn() });
    const result = await new CreateLearningOutcomeUseCase(repo as any).execute(
      { description: 'desc', code: 'lo01' },
      tenantId,
    );
    expect(result.code).toBe('LO01');
  });

  it('creates without subjectId or competencyId', async () => {
    const repo = makeRepo({ save: jest.fn() });
    const result = await new CreateLearningOutcomeUseCase(repo as any).execute(
      { description: 'Generic outcome' },
      tenantId,
    );
    expect(result.subjectId).toBeNull();
    expect(result.competencyId).toBeNull();
  });
});

// ── GetLearningOutcomeUseCase ─────────────────────────────────────────────────

describe('GetLearningOutcomeUseCase', () => {
  it('returns the learning outcome', async () => {
    const lo = makeLO();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(lo) });
    const result = await new GetLearningOutcomeUseCase(repo as any).execute('lo-1', tenantId);
    expect(result.id).toBe('lo-1');
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new GetLearningOutcomeUseCase(repo as any).execute('x', tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── ListLearningOutcomesBySubjectUseCase ──────────────────────────────────────

describe('ListLearningOutcomesBySubjectUseCase', () => {
  it('returns outcomes for a subject', async () => {
    const repo = makeRepo({
      findBySubject: jest.fn().mockResolvedValue([makeLO(), makeLO({ id: 'lo-2', code: 'LO02' })]),
    });
    const result = await new ListLearningOutcomesBySubjectUseCase(repo as any).execute(
      'sub-1',
      tenantId,
    );
    expect(result).toHaveLength(2);
  });
});

// ── ListLearningOutcomesByCompetencyUseCase ───────────────────────────────────

describe('ListLearningOutcomesByCompetencyUseCase', () => {
  it('returns outcomes for a competency', async () => {
    const repo = makeRepo({
      findByCompetency: jest.fn().mockResolvedValue([makeLO({ competencyId: 'comp-1' })]),
    });
    const result = await new ListLearningOutcomesByCompetencyUseCase(repo as any).execute(
      'comp-1',
      tenantId,
    );
    expect(result).toHaveLength(1);
  });
});

// ── UpdateLearningOutcomeUseCase ──────────────────────────────────────────────

describe('UpdateLearningOutcomeUseCase', () => {
  it('updates description and code', async () => {
    const lo = makeLO();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(lo),
      update: jest.fn(),
    });
    const result = await new UpdateLearningOutcomeUseCase(repo as any).execute(
      'lo-1',
      { description: 'Updated description', code: 'lo99' },
      tenantId,
    );
    expect(result.description).toBe('Updated description');
    expect(result.code).toBe('LO99');
    expect(repo.update).toHaveBeenCalled();
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new UpdateLearningOutcomeUseCase(repo as any).execute('x', { description: 'y' }, tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── DeleteLearningOutcomeUseCase ──────────────────────────────────────────────

describe('DeleteLearningOutcomeUseCase', () => {
  it('soft-deletes the learning outcome', async () => {
    const lo = makeLO();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(lo),
      delete: jest.fn(),
    });
    await new DeleteLearningOutcomeUseCase(repo as any).execute('lo-1', tenantId);
    expect(lo.deletedAt).not.toBeNull();
    expect(repo.delete).toHaveBeenCalled();
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new DeleteLearningOutcomeUseCase(repo as any).execute('x', tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
