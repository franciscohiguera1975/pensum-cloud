import { Controller, Get, Param, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import {
  ListLearningOutcomesBySubjectUseCase,
  ListLearningOutcomesByCompetencyUseCase,
} from '../../application/use-cases/learning-outcome.use-cases';

@ApiTags('Learning Outcomes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller()
export class NestedLearningOutcomesController {
  constructor(
    private readonly listBySubject: ListLearningOutcomesBySubjectUseCase,
    private readonly listByCompetency: ListLearningOutcomesByCompetencyUseCase,
  ) {}

  @Get('subjects/:subjectId/learning-outcomes')
  bySubject(@Param('subjectId', ParseUUIDPipe) subjectId: string, @Req() req: Request) {
    return this.listBySubject.execute(subjectId, req.tenantId!);
  }

  @Get('competencies/:competencyId/learning-outcomes')
  byCompetency(@Param('competencyId', ParseUUIDPipe) competencyId: string, @Req() req: Request) {
    return this.listByCompetency.execute(competencyId, req.tenantId!);
  }
}
