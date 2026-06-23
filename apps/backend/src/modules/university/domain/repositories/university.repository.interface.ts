import { University } from '../entities/university.entity';

export const UNIVERSITY_REPOSITORY = Symbol('IUniversityRepository');

export interface IUniversityRepository {
  findById(id: string, tenantId: string): Promise<University | null>;
  findAll(tenantId: string): Promise<University[]>;
  findAllForUser(tenantId: string, userId: string): Promise<University[]>;
  existsByCode(code: string, tenantId: string, excludeId?: string): Promise<boolean>;
  save(university: University): Promise<University>;
  update(university: University): Promise<University>;
}
