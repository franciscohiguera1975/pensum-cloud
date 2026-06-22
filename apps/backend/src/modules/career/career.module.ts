import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CreateCareerUseCase,
  DeleteCareerUseCase,
  GetCareerUseCase,
  ListCareersUseCase,
  UpdateCareerUseCase,
} from './application/use-cases/career.use-cases';
import { CAREER_REPOSITORY } from './domain/repositories/career.repository.interface';
import { PrismaCareerRepository } from './infrastructure/repositories/prisma-career.repository';
import { CareersController } from './presentation/controllers/careers.controller';

const USE_CASES = [
  CreateCareerUseCase,
  GetCareerUseCase,
  ListCareersUseCase,
  UpdateCareerUseCase,
  DeleteCareerUseCase,
];

@Module({
  imports: [AuthModule],
  controllers: [CareersController],
  providers: [
    ...USE_CASES,
    { provide: CAREER_REPOSITORY, useClass: PrismaCareerRepository },
  ],
  exports: [...USE_CASES, CAREER_REPOSITORY],
})
export class CareerModule {}
