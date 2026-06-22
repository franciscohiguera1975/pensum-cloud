export const CURRICULUM_AUDIT_REPOSITORY = Symbol('CURRICULUM_AUDIT_REPOSITORY');

export interface SubjectAuditNode {
  id: string;
  code: string;
  name: string;
  credits: number;
  semesterNumber: number;
  competencyIds: string[];
}

export interface ICurriculumAuditRepository {
  loadSubjectsWithCompetencies(curriculumId: string, tenantId: string): Promise<SubjectAuditNode[]>;
}
