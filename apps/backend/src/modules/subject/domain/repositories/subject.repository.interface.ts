import { Subject } from '../entities/subject.entity';

export const SUBJECT_REPOSITORY = Symbol('SUBJECT_REPOSITORY');

export interface ISubjectRepository {
  findById(id: string, tenantId: string): Promise<Subject | null>;
  findAllBySemester(semesterId: string, tenantId: string): Promise<Subject[]>;
  existsByCode(semesterId: string, code: string, tenantId: string, excludeId?: string): Promise<boolean>;
  save(subject: Subject): Promise<Subject>;
  update(subject: Subject): Promise<Subject>;
  reorderInSemester(tenantId: string, semesterId: string, orderedIds: string[]): Promise<void>;
}
