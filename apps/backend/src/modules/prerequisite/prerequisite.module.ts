import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AddPrerequisiteUseCase,
  ListPrerequisitesUseCase,
  RemovePrerequisiteUseCase,
} from './application/use-cases/prerequisite.use-cases';
import { PREREQUISITE_REPOSITORY } from './domain/repositories/prerequisite.repository.interface';
import { PrismaPrerequisiteRepository } from './infrastructure/repositories/prisma-prerequisite.repository';
import { PrerequisitesController } from './presentation/controllers/prerequisites.controller';

const USE_CASES = [
  AddPrerequisiteUseCase,
  RemovePrerequisiteUseCase,
  ListPrerequisitesUseCase,
];

@Module({
  imports: [AuthModule],
  controllers: [PrerequisitesController],
  providers: [
    ...USE_CASES,
    { provide: PREREQUISITE_REPOSITORY, useClass: PrismaPrerequisiteRepository },
  ],
  exports: [...USE_CASES, PREREQUISITE_REPOSITORY],
})
export class PrerequisiteModule {}
