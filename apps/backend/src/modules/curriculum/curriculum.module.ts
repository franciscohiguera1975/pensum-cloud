import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  ActivateCurriculumUseCase,
  ArchiveCurriculumUseCase,
  CreateCurriculumUseCase,
  DeleteCurriculumUseCase,
  GetCurriculumUseCase,
  ListCurriculaUseCase,
  UpdateCurriculumUseCase,
} from './application/use-cases/curriculum.use-cases';
import { GetCurriculumPathUseCase } from './application/use-cases/curriculum-path.use-case';
import { CURRICULUM_AUDIT_USE_CASES } from './application/use-cases/curriculum-audit.use-cases';
import { CURRICULUM_REPOSITORY } from './domain/repositories/curriculum.repository.interface';
import { CURRICULUM_PATH_REPOSITORY } from './domain/repositories/curriculum-path.repository.interface';
import { CURRICULUM_AUDIT_REPOSITORY } from './domain/repositories/curriculum-audit.repository.interface';
import { PrismaCurriculumRepository } from './infrastructure/repositories/prisma-curriculum.repository';
import { PrismaCurriculumPathRepository } from './infrastructure/repositories/prisma-curriculum-path.repository';
import { PrismaCurriculumAuditRepository } from './infrastructure/repositories/prisma-curriculum-audit.repository';
import { MallaPdfService } from './infrastructure/pdf/malla-pdf.service';
import { MallaExcelService } from './infrastructure/excel/malla-excel.service';
import { CurriculaController } from './presentation/controllers/curricula.controller';

const USE_CASES = [
  CreateCurriculumUseCase,
  GetCurriculumUseCase,
  ListCurriculaUseCase,
  UpdateCurriculumUseCase,
  ActivateCurriculumUseCase,
  ArchiveCurriculumUseCase,
  DeleteCurriculumUseCase,
  GetCurriculumPathUseCase,
  ...CURRICULUM_AUDIT_USE_CASES,
];

@Module({
  imports: [AuthModule],
  controllers: [CurriculaController],
  providers: [
    ...USE_CASES,
    MallaPdfService,
    MallaExcelService,
    { provide: CURRICULUM_REPOSITORY, useClass: PrismaCurriculumRepository },
    { provide: CURRICULUM_PATH_REPOSITORY, useClass: PrismaCurriculumPathRepository },
    { provide: CURRICULUM_AUDIT_REPOSITORY, useClass: PrismaCurriculumAuditRepository },
  ],
  exports: [...USE_CASES, CURRICULUM_REPOSITORY],
})
export class CurriculumModule {}
