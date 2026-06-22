import { NotFoundException } from '@nestjs/common';
import { GetCurriculumPathUseCase } from '../../../../apps/backend/src/modules/curriculum/application/use-cases/curriculum-path.use-case';
import { SubjectNode } from '../../../../apps/backend/src/modules/curriculum/domain/repositories/curriculum-path.repository.interface';

// ── Helpers ───────────────────────────────────────────────────────────────────

const curriculumId = 'curriculum-1';
const tenantId = 'tenant-1';

function makeSubject(overrides: Partial<SubjectNode> = {}): SubjectNode {
  return {
    id: 'subject-1',
    code: 'MAT101',
    name: 'Mathematics I',
    credits: 4,
    semesterNumber: 1,
    prerequisiteIds: [],
    ...overrides,
  };
}

function makeRepos(
  subjects: SubjectNode[],
  curriculumExists = true,
) {
  const pathRepo = {
    loadSubjectGraph: jest.fn().mockResolvedValue(subjects),
  };
  const curriculumRepo = {
    findById: jest.fn().mockResolvedValue(curriculumExists ? { id: curriculumId } : null),
  };
  return { pathRepo, curriculumRepo };
}

function makeUseCase(subjects: SubjectNode[], curriculumExists = true) {
  const { pathRepo, curriculumRepo } = makeRepos(subjects, curriculumExists);
  const uc = new GetCurriculumPathUseCase(pathRepo as any, curriculumRepo as any);
  return { uc, pathRepo, curriculumRepo };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GetCurriculumPathUseCase', () => {
  it('throws NotFoundException when curriculum does not exist', async () => {
    const { uc } = makeUseCase([], false);
    await expect(uc.execute(curriculumId, tenantId, [])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns empty result when curriculum has no subjects', async () => {
    const { uc } = makeUseCase([]);
    const result = await uc.execute(curriculumId, tenantId, []);
    expect(result.curriculumId).toBe(curriculumId);
    expect(result.totalSubjects).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.availableCount).toBe(0);
    expect(result.lockedCount).toBe(0);
    expect(result.subjects).toHaveLength(0);
  });

  it('classifies subject with no prerequisites as AVAILABLE', async () => {
    const subject = makeSubject({ prerequisiteIds: [] });
    const { uc } = makeUseCase([subject]);
    const result = await uc.execute(curriculumId, tenantId, []);
    expect(result.subjects[0].status).toBe('AVAILABLE');
    expect(result.availableCount).toBe(1);
  });

  it('classifies subject as COMPLETED when its id is in completedIds', async () => {
    const subject = makeSubject({ id: 'subject-1' });
    const { uc } = makeUseCase([subject]);
    const result = await uc.execute(curriculumId, tenantId, ['subject-1']);
    expect(result.subjects[0].status).toBe('COMPLETED');
    expect(result.completedCount).toBe(1);
  });

  it('classifies subject as LOCKED when prerequisites are not completed', async () => {
    const subject = makeSubject({ id: 'subject-2', prerequisiteIds: ['subject-1'] });
    const { uc } = makeUseCase([subject]);
    const result = await uc.execute(curriculumId, tenantId, []);
    expect(result.subjects[0].status).toBe('LOCKED');
    expect(result.subjects[0].missingPrerequisites).toEqual(['subject-1']);
    expect(result.lockedCount).toBe(1);
  });

  it('classifies subject as AVAILABLE when all prerequisites are completed', async () => {
    const subject = makeSubject({ id: 'subject-2', prerequisiteIds: ['subject-1'] });
    const { uc } = makeUseCase([subject]);
    const result = await uc.execute(curriculumId, tenantId, ['subject-1']);
    expect(result.subjects[0].status).toBe('AVAILABLE');
  });

  it('handles mixed COMPLETED, AVAILABLE, LOCKED subjects', async () => {
    const s1 = makeSubject({ id: 's1', semesterNumber: 1, prerequisiteIds: [] });
    const s2 = makeSubject({ id: 's2', semesterNumber: 2, prerequisiteIds: ['s1'] });
    const s3 = makeSubject({ id: 's3', semesterNumber: 3, prerequisiteIds: ['s2'] });
    const { uc } = makeUseCase([s1, s2, s3]);

    const result = await uc.execute(curriculumId, tenantId, ['s1']);

    const byId = Object.fromEntries(result.subjects.map((s) => [s.id, s]));
    expect(byId['s1'].status).toBe('COMPLETED');
    expect(byId['s2'].status).toBe('AVAILABLE');
    expect(byId['s3'].status).toBe('LOCKED');
    expect(byId['s3'].missingPrerequisites).toEqual(['s2']);
    expect(result.completedCount).toBe(1);
    expect(result.availableCount).toBe(1);
    expect(result.lockedCount).toBe(1);
    expect(result.totalSubjects).toBe(3);
  });

  it('returns subjects sorted by semesterNumber', async () => {
    const s3 = makeSubject({ id: 's3', semesterNumber: 3 });
    const s1 = makeSubject({ id: 's1', semesterNumber: 1 });
    const s2 = makeSubject({ id: 's2', semesterNumber: 2 });
    const { uc } = makeUseCase([s3, s1, s2]);

    const result = await uc.execute(curriculumId, tenantId, []);
    const semesters = result.subjects.map((s) => s.semesterNumber);
    expect(semesters).toEqual([1, 2, 3]);
  });

  it('subject with multiple prerequisites locks when only some are completed', async () => {
    const subject = makeSubject({ id: 's3', prerequisiteIds: ['s1', 's2'] });
    const { uc } = makeUseCase([subject]);
    const result = await uc.execute(curriculumId, tenantId, ['s1']);
    expect(result.subjects[0].status).toBe('LOCKED');
    expect(result.subjects[0].missingPrerequisites).toEqual(['s2']);
  });

  it('subject with multiple prerequisites becomes AVAILABLE when all are completed', async () => {
    const subject = makeSubject({ id: 's3', prerequisiteIds: ['s1', 's2'] });
    const { uc } = makeUseCase([subject]);
    const result = await uc.execute(curriculumId, tenantId, ['s1', 's2']);
    expect(result.subjects[0].status).toBe('AVAILABLE');
  });
});
