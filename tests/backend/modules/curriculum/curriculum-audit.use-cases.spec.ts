import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CompareCurriculaUseCase,
  FindRedundanciesUseCase,
} from '../../../../apps/backend/src/modules/curriculum/application/use-cases/curriculum-audit.use-cases';
import { SubjectAuditNode } from '../../../../apps/backend/src/modules/curriculum/domain/repositories/curriculum-audit.repository.interface';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1';
const idA = 'curriculum-a';
const idB = 'curriculum-b';

function makeSubject(overrides: Partial<SubjectAuditNode> = {}): SubjectAuditNode {
  return {
    id: 'subj-1',
    code: 'MAT101',
    name: 'Mathematics I',
    credits: 4,
    semesterNumber: 1,
    competencyIds: [],
    ...overrides,
  };
}

function makeRepos(
  subjectsA: SubjectAuditNode[],
  subjectsB: SubjectAuditNode[],
  aExists = true,
  bExists = true,
) {
  const auditRepo = {
    loadSubjectsWithCompetencies: jest
      .fn()
      .mockImplementation((curriculumId: string) =>
        Promise.resolve(curriculumId === idA ? subjectsA : subjectsB),
      ),
  };
  const curriculumRepo = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === idA) return Promise.resolve(aExists ? { id: idA } : null);
      if (id === idB) return Promise.resolve(bExists ? { id: idB } : null);
      return Promise.resolve(null);
    }),
  };
  return { auditRepo, curriculumRepo };
}

// ── CompareCurriculaUseCase ───────────────────────────────────────────────────

describe('CompareCurriculaUseCase', () => {
  it('throws BadRequestException when comparing a curriculum with itself', async () => {
    const { auditRepo, curriculumRepo } = makeRepos([], []);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    await expect(uc.execute(idA, idA, tenantId)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when curriculum A does not exist', async () => {
    const { auditRepo, curriculumRepo } = makeRepos([], [], false, true);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    await expect(uc.execute(idA, idB, tenantId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when curriculum B does not exist', async () => {
    const { auditRepo, curriculumRepo } = makeRepos([], [], true, false);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    await expect(uc.execute(idA, idB, tenantId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('detects UNCHANGED subject when code, name, credits, semester are same', async () => {
    const subj = makeSubject();
    const { auditRepo, curriculumRepo } = makeRepos([subj], [{ ...subj }]);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    const result = await uc.execute(idA, idB, tenantId);
    expect(result.subjects[0].status).toBe('UNCHANGED');
    expect(result.unchangedCount).toBe(1);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.modifiedCount).toBe(0);
  });

  it('detects ADDED subject when present in B but not in A', async () => {
    const subjB = makeSubject({ code: 'NEW101' });
    const { auditRepo, curriculumRepo } = makeRepos([], [subjB]);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    const result = await uc.execute(idA, idB, tenantId);
    expect(result.subjects[0].status).toBe('ADDED');
    expect(result.addedCount).toBe(1);
  });

  it('detects REMOVED subject when present in A but not in B', async () => {
    const subjA = makeSubject({ code: 'OLD101' });
    const { auditRepo, curriculumRepo } = makeRepos([subjA], []);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    const result = await uc.execute(idA, idB, tenantId);
    expect(result.subjects[0].status).toBe('REMOVED');
    expect(result.removedCount).toBe(1);
  });

  it('detects MODIFIED subject when credits differ', async () => {
    const subjA = makeSubject({ code: 'MAT101', credits: 4 });
    const subjB = makeSubject({ code: 'MAT101', credits: 3 });
    const { auditRepo, curriculumRepo } = makeRepos([subjA], [subjB]);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    const result = await uc.execute(idA, idB, tenantId);
    expect(result.subjects[0].status).toBe('MODIFIED');
    expect(result.modifiedCount).toBe(1);
    expect(result.subjects[0].changes).toHaveLength(1);
    expect(result.subjects[0].changes![0]).toEqual({ field: 'credits', from: 4, to: 3 });
  });

  it('detects MODIFIED subject when name changes', async () => {
    const subjA = makeSubject({ name: 'Old Name' });
    const subjB = makeSubject({ name: 'New Name' });
    const { auditRepo, curriculumRepo } = makeRepos([subjA], [subjB]);
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    const result = await uc.execute(idA, idB, tenantId);
    expect(result.subjects[0].status).toBe('MODIFIED');
    expect(result.subjects[0].changes![0].field).toBe('name');
  });

  it('returns correct counts for mixed scenario', async () => {
    const common = makeSubject({ code: 'COM101' });
    const onlyA = makeSubject({ code: 'OLD101' });
    const onlyB = makeSubject({ code: 'NEW101' });
    const modified = makeSubject({ code: 'MOD101' });
    const modifiedB = { ...modified, credits: 2 };

    const { auditRepo, curriculumRepo } = makeRepos(
      [common, onlyA, modified],
      [{ ...common }, onlyB, modifiedB],
    );
    const uc = new CompareCurriculaUseCase(auditRepo as any, curriculumRepo as any);
    const result = await uc.execute(idA, idB, tenantId);
    expect(result.unchangedCount).toBe(1);
    expect(result.removedCount).toBe(1);
    expect(result.addedCount).toBe(1);
    expect(result.modifiedCount).toBe(1);
    expect(result.totalSubjects ?? result.subjects.length).toBe(4);
  });
});

// ── FindRedundanciesUseCase ───────────────────────────────────────────────────

describe('FindRedundanciesUseCase', () => {
  function makeAuditRepo(subjects: SubjectAuditNode[]) {
    return { loadSubjectsWithCompetencies: jest.fn().mockResolvedValue(subjects) };
  }
  function makeCurriculumRepo(exists = true) {
    return { findById: jest.fn().mockResolvedValue(exists ? { id: idA } : null) };
  }

  it('throws NotFoundException when curriculum does not exist', async () => {
    const uc = new FindRedundanciesUseCase(makeAuditRepo([]) as any, makeCurriculumRepo(false) as any);
    await expect(uc.execute(idA, tenantId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns empty groups when no redundancies exist', async () => {
    const subjects = [
      makeSubject({ code: 'A', competencyIds: ['c1'] }),
      makeSubject({ code: 'B', competencyIds: ['c2'] }),
    ];
    const uc = new FindRedundanciesUseCase(makeAuditRepo(subjects) as any, makeCurriculumRepo() as any);
    const result = await uc.execute(idA, tenantId);
    expect(result.totalRedundancyGroups).toBe(0);
    expect(result.groups).toHaveLength(0);
  });

  it('ignores subjects with no competencies', async () => {
    const subjects = [
      makeSubject({ id: 's1', code: 'A', competencyIds: [] }),
      makeSubject({ id: 's2', code: 'B', competencyIds: [] }),
    ];
    const uc = new FindRedundanciesUseCase(makeAuditRepo(subjects) as any, makeCurriculumRepo() as any);
    const result = await uc.execute(idA, tenantId);
    expect(result.totalRedundancyGroups).toBe(0);
  });

  it('detects redundant group when two subjects share same competencies', async () => {
    const subjects = [
      makeSubject({ id: 's1', code: 'A', competencyIds: ['c1', 'c2'] }),
      makeSubject({ id: 's2', code: 'B', competencyIds: ['c1', 'c2'] }),
    ];
    const uc = new FindRedundanciesUseCase(makeAuditRepo(subjects) as any, makeCurriculumRepo() as any);
    const result = await uc.execute(idA, tenantId);
    expect(result.totalRedundancyGroups).toBe(1);
    expect(result.groups[0].reason).toBe('SAME_COMPETENCIES');
    expect(result.groups[0].subjectIds).toContain('s1');
    expect(result.groups[0].subjectIds).toContain('s2');
  });

  it('groups competencies regardless of order', async () => {
    const subjects = [
      makeSubject({ id: 's1', code: 'A', competencyIds: ['c2', 'c1'] }),
      makeSubject({ id: 's2', code: 'B', competencyIds: ['c1', 'c2'] }),
    ];
    const uc = new FindRedundanciesUseCase(makeAuditRepo(subjects) as any, makeCurriculumRepo() as any);
    const result = await uc.execute(idA, tenantId);
    expect(result.totalRedundancyGroups).toBe(1);
  });
});
