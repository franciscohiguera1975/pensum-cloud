import { Curriculum } from '../entities/curriculum.entity';

export const CURRICULUM_REPOSITORY = Symbol('CURRICULUM_REPOSITORY');

export interface ICurriculumRepository {
  findById(id: string, tenantId: string): Promise<Curriculum | null>;
  findAllByCareer(careerId: string, tenantId: string): Promise<Curriculum[]>;
  existsByVersion(careerId: string, version: string, tenantId: string): Promise<boolean>;
  save(curriculum: Curriculum): Promise<Curriculum>;
  update(curriculum: Curriculum): Promise<Curriculum>;
}
