import type { SemesterResponse, SubjectResponse, PrerequisiteResponse } from '@/shared/types/api.types';

export interface SubjectNode3D {
  id: string;
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description: string | null;
  semesterId: string;
  semesterNumber: number;
  position: [number, number, number];
  color: string;
}

export interface PrerequisiteEdge3D {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
}

export interface SemesterColumn3D {
  id: string;
  number: number;
  name: string | null;
  color: string;
  xBase: number;
  labelY: number; // Y for the column header label
}

export const SEMESTER_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
];

// Card dimensions (kept here for layout math)
export const CARD_W = 2.8;
export const CARD_H = 1.9;
const COL_SPACING = 3.4; // center-to-center (cards are 2.8 wide)
const ROW_SPACING = 2.3; // center-to-center (cards are 1.9 tall)

export function buildScene(
  semesters: SemesterResponse[],
  subjects: SubjectResponse[],
  prerequisites: PrerequisiteResponse[],
): { nodes: SubjectNode3D[]; edges: PrerequisiteEdge3D[]; semesterColumns: SemesterColumn3D[] } {
  const sorted = [...semesters].sort((a, b) => a.number - b.number);

  const bySemester = new Map<string, SubjectResponse[]>();
  for (const sem of sorted) bySemester.set(sem.id, []);
  for (const sub of subjects) {
    const arr = bySemester.get(sub.semesterId);
    if (arr) arr.push(sub);
  }

  const posMap = new Map<string, [number, number, number]>();
  const nodes: SubjectNode3D[] = [];
  const semesterColumns: SemesterColumn3D[] = [];

  sorted.forEach((sem, colIdx) => {
    const semSubjects = bySemester.get(sem.id) ?? [];
    const color = SEMESTER_COLORS[(sem.number - 1) % SEMESTER_COLORS.length];
    const xBase = colIdx * COL_SPACING;

    // top Y = half of column height + gap for label
    const halfH = semSubjects.length > 0 ? ((semSubjects.length - 1) / 2) * ROW_SPACING : 0;
    semesterColumns.push({
      id: sem.id,
      number: sem.number,
      name: sem.name ?? null,
      color,
      xBase,
      labelY: halfH + CARD_H / 2 + 0.8,
    });

    semSubjects.forEach((sub, rowIdx) => {
      const yOffset = (rowIdx - (semSubjects.length - 1) / 2) * ROW_SPACING;
      const pos: [number, number, number] = [xBase, yOffset, 0];
      posMap.set(sub.id, pos);

      nodes.push({
        id: sub.id,
        name: sub.name,
        code: sub.code,
        credits: sub.credits,
        hoursTheory: sub.hoursTheory,
        hoursPractice: sub.hoursPractice,
        description: sub.description,
        semesterId: sub.semesterId,
        semesterNumber: sem.number,
        position: pos,
        color,
      });
    });
  });

  const edges: PrerequisiteEdge3D[] = [];
  for (const prereq of prerequisites) {
    const from = posMap.get(prereq.requiresId);
    const to = posMap.get(prereq.subjectId);
    if (from && to) {
      edges.push({
        id: `edge-${prereq.requiresId}-${prereq.subjectId}`,
        from,
        to,
      });
    }
  }

  return { nodes, edges, semesterColumns };
}
