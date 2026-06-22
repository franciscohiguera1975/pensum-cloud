import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CreateSubjectUseCase,
  DeleteSubjectUseCase,
  GetSubjectUseCase,
  ListSubjectsUseCase,
  MoveSubjectUseCase,
  ReorderSubjectUseCase,
  UpdateSubjectUseCase,
} from './application/use-cases/subject.use-cases';
import { SUBJECT_REPOSITORY } from './domain/repositories/subject.repository.interface';
import { PrismaSubjectRepository } from './infrastructure/repositories/prisma-subject.repository';
import { SubjectsController } from './presentation/controllers/subjects.controller';

const USE_CASES = [
  CreateSubjectUseCase,
  GetSubjectUseCase,
  ListSubjectsUseCase,
  UpdateSubjectUseCase,
  DeleteSubjectUseCase,
  MoveSubjectUseCase,
  ReorderSubjectUseCase,
];

@Module({
  imports: [AuthModule],
  controllers: [SubjectsController],
  providers: [
    ...USE_CASES,
    { provide: SUBJECT_REPOSITORY, useClass: PrismaSubjectRepository },
  ],
  exports: [...USE_CASES, SUBJECT_REPOSITORY],
})
export class SubjectModule {}
