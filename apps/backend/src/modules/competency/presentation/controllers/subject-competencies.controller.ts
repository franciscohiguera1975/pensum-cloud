import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import {
  AddCompetencyToSubjectUseCase,
  RemoveCompetencyFromSubjectUseCase,
  ListSubjectCompetenciesUseCase,
} from '../../application/use-cases/competency.use-cases';
import { AddCompetencyToSubjectDto } from '../../application/dto/competency.dto';

@ApiTags('Subject Competencies')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('subjects/:subjectId/competencies')
export class SubjectCompetenciesController {
  constructor(
    private readonly add: AddCompetencyToSubjectUseCase,
    private readonly remove: RemoveCompetencyFromSubjectUseCase,
    private readonly list: ListSubjectCompetenciesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  addCompetency(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Body() dto: AddCompetencyToSubjectDto,
    @Req() req: Request,
  ) {
    return this.add.execute(subjectId, dto.competencyId, req.tenantId!);
  }

  @Get()
  listCompetencies(@Param('subjectId', ParseUUIDPipe) subjectId: string) {
    return this.list.execute(subjectId);
  }

  @Delete(':competencyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCompetency(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Param('competencyId', ParseUUIDPipe) competencyId: string,
  ) {
    return this.remove.execute(subjectId, competencyId);
  }
}
