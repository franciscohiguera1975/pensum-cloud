import { Competency } from '../entities/competency.entity';

export const COMPETENCY_REPOSITORY = Symbol('COMPETENCY_REPOSITORY');

export interface ICompetencyRepository {
  findById(id: string, tenantId: string): Promise<Competency | null>;
  findAll(tenantId: string): Promise<Competency[]>;
  existsByCode(code: string, tenantId: string, excludeId?: string): Promise<boolean>;
  save(competency: Competency): Promise<void>;
  update(competency: Competency): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}
