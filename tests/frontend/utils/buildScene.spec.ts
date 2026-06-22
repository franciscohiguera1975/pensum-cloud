import { describe, it, expect } from 'vitest';
import { buildScene } from '../../../apps/frontend/src/modules/threejs-viewer/utils/buildScene';
import type { SemesterResponse, SubjectResponse, PrerequisiteResponse } from '../../../apps/frontend/src/shared/types/api.types';

const makeSemester = (id: string, number: number): SemesterResponse => ({
  id,
  tenantId: 'tid',
  curriculumId: 'cid',
  number,
  name: `Semestre ${number}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const makeSubject = (id: string, semesterId: string, code: string, credits = 3): SubjectResponse => ({
  id,
  tenantId: 'tid',
  semesterId,
  name: `Materia ${code}`,
  code,
  credits,
  hoursTheory: 2,
  hoursPractice: 2,
  description: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const makePrerequisite = (subjectId: string, requiresId: string): PrerequisiteResponse => ({
  subjectId,
  requiresId,
  tenantId: 'tid',
  createdAt: new Date().toISOString(),
});

describe('buildScene', () => {
  it('should create one node per subject', () => {
    const semesters = [makeSemester('s1', 1), makeSemester('s2', 2)];
    const subjects = [makeSubject('sub1', 's1', 'A'), makeSubject('sub2', 's2', 'B')];
    const { nodes } = buildScene(semesters, subjects, []);
    expect(nodes).toHaveLength(2);
  });

  it('should create one edge per prerequisite with valid positions', () => {
    const semesters = [makeSemester('s1', 1), makeSemester('s2', 2)];
    const subjects = [makeSubject('sub1', 's1', 'A'), makeSubject('sub2', 's2', 'B')];
    const prerequisites = [makePrerequisite('sub2', 'sub1')];
    const { edges } = buildScene(semesters, subjects, prerequisites);

    expect(edges).toHaveLength(1);
    expect(edges[0].from).toHaveLength(3);
    expect(edges[0].to).toHaveLength(3);
  });

  it('should skip edges when subject positions are missing', () => {
    const semesters = [makeSemester('s1', 1)];
    const subjects = [makeSubject('sub1', 's1', 'A')];
    // requiresId 'ghost' doesn't exist
    const prerequisites = [makePrerequisite('sub1', 'ghost')];
    const { edges } = buildScene(semesters, subjects, prerequisites);
    expect(edges).toHaveLength(0);
  });

  it('should place subjects in different x positions per semester', () => {
    const semesters = [makeSemester('s1', 1), makeSemester('s2', 2)];
    const subjects = [makeSubject('sub1', 's1', 'A'), makeSubject('sub2', 's2', 'B')];
    const { nodes } = buildScene(semesters, subjects, []);

    const node1 = nodes.find((n) => n.id === 'sub1')!;
    const node2 = nodes.find((n) => n.id === 'sub2')!;
    expect(node1.position[0]).not.toBe(node2.position[0]);
  });

  it('should assign different colors per semester', () => {
    const semesters = [makeSemester('s1', 1), makeSemester('s2', 2)];
    const subjects = [makeSubject('sub1', 's1', 'A'), makeSubject('sub2', 's2', 'B')];
    const { nodes } = buildScene(semesters, subjects, []);

    const n1 = nodes.find((n) => n.id === 'sub1')!;
    const n2 = nodes.find((n) => n.id === 'sub2')!;
    expect(n1.color).not.toBe(n2.color);
  });
});
