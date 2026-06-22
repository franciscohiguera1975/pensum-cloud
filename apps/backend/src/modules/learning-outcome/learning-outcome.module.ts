import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LEARNING_OUTCOME_REPOSITORY } from './domain/repositories/learning-outcome.repository.interface';
import { PrismaLearningOutcomeRepository } from './infrastructure/repositories/prisma-learning-outcome.repository';
import { LEARNING_OUTCOME_USE_CASES } from './application/use-cases/learning-outcome.use-cases';
import { LearningOutcomesController } from './presentation/controllers/learning-outcomes.controller';
import { NestedLearningOutcomesController } from './presentation/controllers/nested-learning-outcomes.controller';

@Module({
  imports: [AuthModule],
  controllers: [LearningOutcomesController, NestedLearningOutcomesController],
  providers: [
    { provide: LEARNING_OUTCOME_REPOSITORY, useClass: PrismaLearningOutcomeRepository },
    ...LEARNING_OUTCOME_USE_CASES,
  ],
  exports: [LEARNING_OUTCOME_REPOSITORY],
})
export class LearningOutcomeModule {}
