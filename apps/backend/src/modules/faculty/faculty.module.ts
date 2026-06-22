import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CreateFacultyUseCase,
  DeleteFacultyUseCase,
  GetFacultyUseCase,
  ListFacultiesUseCase,
  UpdateFacultyUseCase,
} from './application/use-cases/faculty.use-cases';
import { FACULTY_REPOSITORY } from './domain/repositories/faculty.repository.interface';
import { PrismaFacultyRepository } from './infrastructure/repositories/prisma-faculty.repository';
import { FacultiesController } from './presentation/controllers/faculties.controller';

const USE_CASES = [
  CreateFacultyUseCase,
  GetFacultyUseCase,
  ListFacultiesUseCase,
  UpdateFacultyUseCase,
  DeleteFacultyUseCase,
];

@Module({
  imports: [AuthModule],
  controllers: [FacultiesController],
  providers: [
    ...USE_CASES,
    { provide: FACULTY_REPOSITORY, useClass: PrismaFacultyRepository },
  ],
  exports: [...USE_CASES, FACULTY_REPOSITORY],
})
export class FacultyModule {}
