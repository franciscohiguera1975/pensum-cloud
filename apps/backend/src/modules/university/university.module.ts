import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CreateUniversityUseCase,
  DeleteUniversityUseCase,
  GetUniversityUseCase,
  ListUniversitiesUseCase,
  UpdateUniversityUseCase,
} from './application/use-cases';
import { UNIVERSITY_REPOSITORY } from './domain/repositories/university.repository.interface';
import { PrismaUniversityRepository } from './infrastructure/repositories/prisma-university.repository';
import { UniversitiesController } from './presentation/controllers/universities.controller';

const USE_CASES = [
  CreateUniversityUseCase,
  GetUniversityUseCase,
  ListUniversitiesUseCase,
  UpdateUniversityUseCase,
  DeleteUniversityUseCase,
];

@Module({
  imports: [AuthModule],
  controllers: [UniversitiesController],
  providers: [
    ...USE_CASES,
    { provide: UNIVERSITY_REPOSITORY, useClass: PrismaUniversityRepository },
  ],
  exports: [...USE_CASES, UNIVERSITY_REPOSITORY],
})
export class UniversityModule {}
