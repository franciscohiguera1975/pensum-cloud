import { Semester } from '../entities/semester.entity';

export const SEMESTER_REPOSITORY = Symbol('SEMESTER_REPOSITORY');

export interface ISemesterRepository {
  findById(id: string, tenantId: string): Promise<Semester | null>;
  findAllByCurriculum(curriculumId: string, tenantId: string): Promise<Semester[]>;
  existsByNumber(curriculumId: string, number: number, tenantId: string): Promise<boolean>;
  save(semester: Semester): Promise<Semester>;
  update(semester: Semester): Promise<Semester>;
}
