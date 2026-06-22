import { useMemo } from 'react';
import { usePensumFlow } from '@/modules/reactflow-editor/hooks/usePensumFlow';
import { buildScene } from '../utils/buildScene';

export function useViewerScene(curriculumId: string) {
  const { semesters, subjects, prerequisites, isLoading } = usePensumFlow(curriculumId);

  const { nodes, edges, semesterColumns } = useMemo(
    () => buildScene(semesters, subjects, prerequisites),
    [semesters, subjects, prerequisites],
  );

  return { nodes, edges, semesterColumns, semesters, isLoading };
}
