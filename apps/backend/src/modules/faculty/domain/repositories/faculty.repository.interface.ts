import { Faculty } from '../entities/faculty.entity';

export const FACULTY_REPOSITORY = Symbol('IFacultyRepository');

export interface IFacultyRepository {
  findById(id: string, tenantId: string): Promise<Faculty | null>;
  findAllByUniversity(universityId: string, tenantId: string): Promise<Faculty[]>;
  existsByCode(code: string, universityId: string, excludeId?: string): Promise<boolean>;
  save(faculty: Faculty): Promise<Faculty>;
  update(faculty: Faculty): Promise<Faculty>;
}
