import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CreateSemesterUseCase,
  DeleteSemesterUseCase,
  GetSemesterUseCase,
  ListSemestersUseCase,
  UpdateSemesterUseCase,
} from './application/use-cases/semester.use-cases';
import { SEMESTER_REPOSITORY } from './domain/repositories/semester.repository.interface';
import { PrismaSemesterRepository } from './infrastructure/repositories/prisma-semester.repository';
import { SemestersController } from './presentation/controllers/semesters.controller';

const USE_CASES = [
  CreateSemesterUseCase,
  GetSemesterUseCase,
  ListSemestersUseCase,
  UpdateSemesterUseCase,
  DeleteSemesterUseCase,
];

@Module({
  imports: [AuthModule],
  controllers: [SemestersController],
  providers: [
    ...USE_CASES,
    { provide: SEMESTER_REPOSITORY, useClass: PrismaSemesterRepository },
  ],
  exports: [...USE_CASES, SEMESTER_REPOSITORY],
})
export class SemesterModule {}
