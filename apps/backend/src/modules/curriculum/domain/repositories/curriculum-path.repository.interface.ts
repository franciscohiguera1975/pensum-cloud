export const CURRICULUM_PATH_REPOSITORY = Symbol('CURRICULUM_PATH_REPOSITORY');

export interface SubjectNode {
  id: string;
  code: string;
  name: string;
  credits: number;
  semesterNumber: number;
  prerequisiteIds: string[];
}

export interface ICurriculumPathRepository {
  loadSubjectGraph(curriculumId: string, tenantId: string): Promise<SubjectNode[]>;
}
