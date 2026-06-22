import { describe, it, expect } from 'vitest';
import { buildFlowGraph } from '../../../apps/frontend/src/modules/reactflow-editor/utils/buildFlowGraph';
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

const makeSubject = (id: string, semesterId: string, code: string): SubjectResponse => ({
  id,
  tenantId: 'tid',
  semesterId,
  name: `Materia ${code}`,
  code,
  credits: 3,
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

describe('buildFlowGraph', () => {
  it('should create one header node and one subject node per semester/subject', () => {
    const semesters = [makeSemester('s1', 1), makeSemester('s2', 2)];
    const subjects = [makeSubject('sub1', 's1', 'MAT101'), makeSubject('sub2', 's2', 'MAT201')];
    const { nodes } = buildFlowGraph(semesters, subjects, []);

    // 2 header nodes + 2 subject nodes
    expect(nodes).toHaveLength(4);
    const subjectNodes = nodes.filter((n) => n.type === 'subject');
    expect(subjectNodes).toHaveLength(2);
  });

  it('should create an edge for each prerequisite', () => {
    const semesters = [makeSemester('s1', 1), makeSemester('s2', 2)];
    const subjects = [makeSubject('sub1', 's1', 'MAT101'), makeSubject('sub2', 's2', 'MAT201')];
    const prerequisites = [makePrerequisite('sub2', 'sub1')];

    const { edges } = buildFlowGraph(semesters, subjects, prerequisites);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('sub1');
    expect(edges[0].target).toBe('sub2');
  });

  it('should return empty nodes and edges when there are no semesters', () => {
    const { nodes, edges } = buildFlowGraph([], [], []);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it('should sort semesters by number when out of order', () => {
    const semesters = [makeSemester('s2', 2), makeSemester('s1', 1)];
    const subjects = [
      makeSubject('sub1', 's1', 'MAT101'),
      makeSubject('sub2', 's2', 'MAT201'),
    ];
    const { nodes } = buildFlowGraph(semesters, subjects, []);

    const headerNodes = nodes.filter((n) => n.type === 'semesterHeader');
    // First header should be semester 1 (leftmost x)
    const firstHeader = headerNodes.reduce((a, b) => (a.position.x < b.position.x ? a : b));
    expect(firstHeader.data.semesterNumber).toBe(1);
  });

  it('should position subjects in correct columns by semester', () => {
    const semesters = [makeSemester('s1', 1), makeSemester('s2', 2)];
    const subjects = [makeSubject('sub1', 's1', 'A'), makeSubject('sub2', 's2', 'B')];
    const { nodes } = buildFlowGraph(semesters, subjects, []);

    const sub1 = nodes.find((n) => n.id === 'sub1')!;
    const sub2 = nodes.find((n) => n.id === 'sub2')!;

    expect(sub1.position.x).toBeLessThan(sub2.position.x);
  });
});
