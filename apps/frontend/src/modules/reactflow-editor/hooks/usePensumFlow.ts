import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { semesterApi } from '@/modules/semester/infrastructure/semester.api';
import { subjectApi } from '@/modules/subject/infrastructure/subject.api';
import { prerequisiteApi } from '@/modules/prerequisite/infrastructure/prerequisite.api';
import { buildFlowGraph } from '../utils/buildFlowGraph';
import type { PrerequisiteResponse } from '@/shared/types/api.types';

export function usePensumFlow(curriculumId: string) {
  const { data: semesters = [], isLoading: loadingSemesters } = useQuery({
    queryKey: ['semesters', curriculumId],
    queryFn: () => semesterApi.listByCurriculum(curriculumId),
    enabled: !!curriculumId,
  });

  const semesterIds = semesters.map((s) => s.id);

  const subjectQueries = useQuery({
    queryKey: ['subjects-all', ...semesterIds],
    queryFn: async () => {
      const results = await Promise.all(semesterIds.map((id) => subjectApi.listBySemester(id)));
      return results.flat();
    },
    enabled: semesterIds.length > 0,
  });

  const subjects = subjectQueries.data ?? [];
  const subjectIds = subjects.map((s) => s.id);

  const prerequisiteQueries = useQuery({
    queryKey: ['prerequisites-all', ...subjectIds],
    queryFn: async () => {
      const results = await Promise.all(
        subjectIds.map((id) => prerequisiteApi.listBySubject(id)),
      );
      // Deduplicate by (subjectId, requiresId)
      const seen = new Set<string>();
      const unique: PrerequisiteResponse[] = [];
      for (const prereq of results.flat()) {
        const key = `${prereq.subjectId}:${prereq.requiresId}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(prereq);
        }
      }
      return unique;
    },
    enabled: subjectIds.length > 0,
  });

  const prerequisites = prerequisiteQueries.data ?? [];

  const { nodes, edges } = useMemo(
    () => buildFlowGraph(semesters, subjects, prerequisites),
    [semesters, subjects, prerequisites],
  );

  const isLoading = loadingSemesters || subjectQueries.isLoading || prerequisiteQueries.isLoading;

  return { nodes, edges, semesters, subjects, prerequisites, isLoading };
}
