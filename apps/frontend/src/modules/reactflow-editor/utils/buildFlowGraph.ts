import type { Edge, Node } from '@xyflow/react';
import type { SemesterResponse, SubjectResponse, PrerequisiteResponse } from '@/shared/types/api.types';

export interface SubjectNodeData extends Record<string, unknown> {
  label: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  semesterId: string;
  semesterNumber: number;
  semesterName: string | null;
  description: string | null;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const COL_SPACING = 280;
const ROW_SPACING = 110;
const HEADER_HEIGHT = 50;

export function buildFlowGraph(
  semesters: SemesterResponse[],
  subjects: SubjectResponse[],
  prerequisites: PrerequisiteResponse[],
): { nodes: Node<SubjectNodeData>[]; edges: Edge[] } {
  const sorted = [...semesters].sort((a, b) => a.number - b.number);

  const nodes: Node<SubjectNodeData>[] = [];
  const edges: Edge[] = [];

  // Group subjects by semester
  const bySemester = new Map<string, SubjectResponse[]>();
  for (const sem of sorted) {
    bySemester.set(sem.id, []);
  }
  for (const sub of subjects) {
    const arr = bySemester.get(sub.semesterId);
    if (arr) arr.push(sub);
  }

  // Semester header nodes
  sorted.forEach((sem, colIdx) => {
    const x = colIdx * COL_SPACING;
    nodes.push({
      id: `sem-${sem.id}`,
      type: 'semesterHeader',
      position: { x, y: 0 },
      data: {
        label: sem.name ?? `Semestre ${sem.number}`,
        code: '',
        credits: 0,
        hoursTheory: 0,
        hoursPractice: 0,
        semesterId: sem.id,
        semesterNumber: sem.number,
        semesterName: sem.name ?? null,
        description: null,
      },
      style: { width: NODE_WIDTH },
      draggable: false,
      selectable: false,
    });

    // Subject nodes in this column
    const semSubjects = bySemester.get(sem.id) ?? [];
    semSubjects.forEach((sub, rowIdx) => {
      nodes.push({
        id: sub.id,
        type: 'subject',
        position: { x, y: HEADER_HEIGHT + rowIdx * ROW_SPACING },
        data: {
          label: sub.name,
          code: sub.code,
          credits: sub.credits,
          hoursTheory: sub.hoursTheory,
          hoursPractice: sub.hoursPractice,
          semesterId: sub.semesterId,
          semesterNumber: sem.number,
          semesterName: sem.name ?? null,
          description: sub.description,
        },
        style: { width: NODE_WIDTH, height: NODE_HEIGHT },
      });
    });
  });

  // Prerequisite edges
  for (const prereq of prerequisites) {
    edges.push({
      id: `edge-${prereq.requiresId}-${prereq.subjectId}`,
      source: prereq.requiresId,
      target: prereq.subjectId,
      type: 'deletable',
      animated: false,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#6366f1' } as Edge['markerEnd'],
    });
  }

  return { nodes, edges };
}
