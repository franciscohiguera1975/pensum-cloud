import { Prerequisite } from '../entities/prerequisite.entity';

export const PREREQUISITE_REPOSITORY = Symbol('PREREQUISITE_REPOSITORY');

export interface IPrerequisiteRepository {
  findBySubject(subjectId: string, tenantId: string): Promise<Prerequisite[]>;
  exists(subjectId: string, requiresId: string, tenantId: string): Promise<boolean>;
  save(prerequisite: Prerequisite): Promise<Prerequisite>;
  delete(subjectId: string, requiresId: string, tenantId: string): Promise<void>;
}
