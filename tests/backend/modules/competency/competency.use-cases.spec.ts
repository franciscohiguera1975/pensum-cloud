import { ConflictException, NotFoundException } from '@nestjs/common';
import { Competency } from '../../../../apps/backend/src/modules/competency/domain/entities/competency.entity';
import {
  CreateCompetencyUseCase,
  GetCompetencyUseCase,
  ListCompetenciesUseCase,
  UpdateCompetencyUseCase,
  DeleteCompetencyUseCase,
  AddCompetencyToSubjectUseCase,
  RemoveCompetencyFromSubjectUseCase,
  ListSubjectCompetenciesUseCase,
} from '../../../../apps/backend/src/modules/competency/application/use-cases/competency.use-cases';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1';

function makeCompetency(overrides: Partial<Parameters<typeof Competency.create>[0]> = {}) {
  return Competency.create({
    id: 'comp-1',
    tenantId,
    name: 'Critical Thinking',
    code: 'CT01',
    ...overrides,
  });
}

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    existsByCode: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

function makeLinkRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    exists: jest.fn(),
    link: jest.fn(),
    unlink: jest.fn(),
    findBySubject: jest.fn(),
    ...overrides,
  };
}

// ── CreateCompetencyUseCase ───────────────────────────────────────────────────

describe('CreateCompetencyUseCase', () => {
  it('creates and saves a competency', async () => {
    const repo = makeRepo({ existsByCode: jest.fn().mockResolvedValue(false), save: jest.fn() });
    const uc = new CreateCompetencyUseCase(repo as any);
    const result = await uc.execute({ name: 'Critical Thinking', code: 'CT01' }, tenantId);
    expect(result.name).toBe('Critical Thinking');
    expect(result.code).toBe('CT01');
    expect(repo.save).toHaveBeenCalled();
  });

  it('uppercases the code', async () => {
    const repo = makeRepo({ existsByCode: jest.fn().mockResolvedValue(false), save: jest.fn() });
    const uc = new CreateCompetencyUseCase(repo as any);
    const result = await uc.execute({ name: 'Thinking', code: 'ct01' }, tenantId);
    expect(result.code).toBe('CT01');
  });

  it('throws ConflictException when code already exists', async () => {
    const repo = makeRepo({ existsByCode: jest.fn().mockResolvedValue(true) });
    const uc = new CreateCompetencyUseCase(repo as any);
    await expect(uc.execute({ name: 'X', code: 'CT01' }, tenantId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

// ── GetCompetencyUseCase ──────────────────────────────────────────────────────

describe('GetCompetencyUseCase', () => {
  it('returns the competency', async () => {
    const comp = makeCompetency();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(comp) });
    const result = await new GetCompetencyUseCase(repo as any).execute('comp-1', tenantId);
    expect(result.id).toBe('comp-1');
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new GetCompetencyUseCase(repo as any).execute('x', tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── ListCompetenciesUseCase ───────────────────────────────────────────────────

describe('ListCompetenciesUseCase', () => {
  it('returns all competencies for tenant', async () => {
    const repo = makeRepo({
      findAll: jest.fn().mockResolvedValue([makeCompetency(), makeCompetency({ id: 'comp-2', code: 'CT02' })]),
    });
    const result = await new ListCompetenciesUseCase(repo as any).execute(tenantId);
    expect(result).toHaveLength(2);
  });
});

// ── UpdateCompetencyUseCase ───────────────────────────────────────────────────

describe('UpdateCompetencyUseCase', () => {
  it('updates the competency', async () => {
    const comp = makeCompetency();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(comp),
      existsByCode: jest.fn().mockResolvedValue(false),
      update: jest.fn(),
    });
    const result = await new UpdateCompetencyUseCase(repo as any).execute(
      'comp-1',
      { name: 'New Name' },
      tenantId,
    );
    expect(result.name).toBe('New Name');
    expect(repo.update).toHaveBeenCalled();
  });

  it('throws ConflictException when code taken by another', async () => {
    const comp = makeCompetency();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(comp),
      existsByCode: jest.fn().mockResolvedValue(true),
    });
    await expect(
      new UpdateCompetencyUseCase(repo as any).execute('comp-1', { code: 'CT99' }, tenantId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

// ── DeleteCompetencyUseCase ───────────────────────────────────────────────────

describe('DeleteCompetencyUseCase', () => {
  it('soft-deletes the competency', async () => {
    const comp = makeCompetency();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(comp),
      delete: jest.fn(),
    });
    await new DeleteCompetencyUseCase(repo as any).execute('comp-1', tenantId);
    expect(comp.deletedAt).not.toBeNull();
    expect(repo.delete).toHaveBeenCalled();
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new DeleteCompetencyUseCase(repo as any).execute('x', tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── SubjectCompetency link/unlink ─────────────────────────────────────────────

describe('AddCompetencyToSubjectUseCase', () => {
  it('links competency to subject', async () => {
    const comp = makeCompetency();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(comp) });
    const linkRepo = makeLinkRepo({
      exists: jest.fn().mockResolvedValue(false),
      link: jest.fn(),
    });
    await new AddCompetencyToSubjectUseCase(repo as any, linkRepo as any).execute(
      'sub-1',
      'comp-1',
      tenantId,
    );
    expect(linkRepo.link).toHaveBeenCalledWith('sub-1', 'comp-1');
  });

  it('throws ConflictException if already linked', async () => {
    const comp = makeCompetency();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(comp) });
    const linkRepo = makeLinkRepo({ exists: jest.fn().mockResolvedValue(true) });
    await expect(
      new AddCompetencyToSubjectUseCase(repo as any, linkRepo as any).execute('s', 'c', tenantId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('RemoveCompetencyFromSubjectUseCase', () => {
  it('unlinks competency from subject', async () => {
    const linkRepo = makeLinkRepo({
      exists: jest.fn().mockResolvedValue(true),
      unlink: jest.fn(),
    });
    await new RemoveCompetencyFromSubjectUseCase(linkRepo as any).execute('sub-1', 'comp-1');
    expect(linkRepo.unlink).toHaveBeenCalled();
  });

  it('throws NotFoundException if not linked', async () => {
    const linkRepo = makeLinkRepo({ exists: jest.fn().mockResolvedValue(false) });
    await expect(
      new RemoveCompetencyFromSubjectUseCase(linkRepo as any).execute('s', 'c'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ListSubjectCompetenciesUseCase', () => {
  it('returns competencies for subject', async () => {
    const linkRepo = makeLinkRepo({
      findBySubject: jest.fn().mockResolvedValue([makeCompetency()]),
    });
    const result = await new ListSubjectCompetenciesUseCase(linkRepo as any).execute('sub-1');
    expect(result).toHaveLength(1);
  });
});
