import { LearningOutcome } from '../entities/learning-outcome.entity';

export const LEARNING_OUTCOME_REPOSITORY = Symbol('LEARNING_OUTCOME_REPOSITORY');

export interface ILearningOutcomeRepository {
  findById(id: string, tenantId: string): Promise<LearningOutcome | null>;
  findBySubject(subjectId: string, tenantId: string): Promise<LearningOutcome[]>;
  findByCompetency(competencyId: string, tenantId: string): Promise<LearningOutcome[]>;
  save(lo: LearningOutcome): Promise<void>;
  update(lo: LearningOutcome): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}
