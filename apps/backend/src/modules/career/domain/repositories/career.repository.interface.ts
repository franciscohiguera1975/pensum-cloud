import { Career } from '../entities/career.entity';

export const CAREER_REPOSITORY = Symbol('ICareerRepository');

export interface ICareerRepository {
  findById(id: string, tenantId: string): Promise<Career | null>;
  findAllByFaculty(facultyId: string, tenantId: string): Promise<Career[]>;
  existsByCode(code: string, facultyId: string, excludeId?: string): Promise<boolean>;
  save(career: Career): Promise<Career>;
  update(career: Career): Promise<Career>;
}
