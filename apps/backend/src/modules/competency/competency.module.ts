import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { COMPETENCY_REPOSITORY } from './domain/repositories/competency.repository.interface';
import {
  SUBJECT_COMPETENCY_REPOSITORY,
  COMPETENCY_USE_CASES,
} from './application/use-cases/competency.use-cases';
import { PrismaCompetencyRepository } from './infrastructure/repositories/prisma-competency.repository';
import { PrismaSubjectCompetencyRepository } from './infrastructure/repositories/prisma-subject-competency.repository';
import { CompetenciesController } from './presentation/controllers/competencies.controller';
import { SubjectCompetenciesController } from './presentation/controllers/subject-competencies.controller';

@Module({
  imports: [AuthModule],
  controllers: [CompetenciesController, SubjectCompetenciesController],
  providers: [
    { provide: COMPETENCY_REPOSITORY, useClass: PrismaCompetencyRepository },
    { provide: SUBJECT_COMPETENCY_REPOSITORY, useClass: PrismaSubjectCompetencyRepository },
    ...COMPETENCY_USE_CASES,
  ],
  exports: [COMPETENCY_REPOSITORY, SUBJECT_COMPETENCY_REPOSITORY],
})
export class CompetencyModule {}
