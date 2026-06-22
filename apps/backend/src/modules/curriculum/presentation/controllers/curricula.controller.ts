import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import {
  CurriculumResponseDto,
  CreateCurriculumDto,
  UpdateCurriculumDto,
} from '../../application/dto/curriculum.dto';
import {
  ActivateCurriculumUseCase,
  ArchiveCurriculumUseCase,
  CreateCurriculumUseCase,
  DeleteCurriculumUseCase,
  GetCurriculumUseCase,
  ListCurriculaUseCase,
  UpdateCurriculumUseCase,
} from '../../application/use-cases/curriculum.use-cases';
import { GetCurriculumPathUseCase } from '../../application/use-cases/curriculum-path.use-case';
import { CurriculumPathResponseDto } from '../../application/dto/curriculum-path.dto';
import {
  CompareCurriculaUseCase,
  FindRedundanciesUseCase,
} from '../../application/use-cases/curriculum-audit.use-cases';
import {
  CurriculumCompareResponseDto,
  CurriculumRedundanciesResponseDto,
} from '../../application/dto/curriculum-audit.dto';
import { MallaPdfService } from '../../infrastructure/pdf/malla-pdf.service';
import { MallaExcelService } from '../../infrastructure/excel/malla-excel.service';

@ApiTags('Curricula')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller()
export class CurriculaController {
  constructor(
    private readonly createCurriculum: CreateCurriculumUseCase,
    private readonly getCurriculum: GetCurriculumUseCase,
    private readonly listCurricula: ListCurriculaUseCase,
    private readonly updateCurriculum: UpdateCurriculumUseCase,
    private readonly activateCurriculum: ActivateCurriculumUseCase,
    private readonly archiveCurriculum: ArchiveCurriculumUseCase,
    private readonly deleteCurriculum: DeleteCurriculumUseCase,
    private readonly getPath: GetCurriculumPathUseCase,
    private readonly compareCurricula: CompareCurriculaUseCase,
    private readonly findRedundancies: FindRedundanciesUseCase,
    private readonly mallaPdf: MallaPdfService,
    private readonly mallaExcel: MallaExcelService,
  ) {}

  @Post('careers/:careerId/curricula')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a curriculum for a career' })
  @ApiParam({ name: 'careerId', format: 'uuid' })
  @ApiResponse({ status: 201, type: CurriculumResponseDto })
  @ApiResponse({ status: 409, description: 'Version already exists' })
  create(
    @Req() req: Request,
    @Param('careerId', ParseUUIDPipe) careerId: string,
    @Body() dto: CreateCurriculumDto,
  ): Promise<CurriculumResponseDto> {
    return this.createCurriculum.execute(req.tenantId!, careerId, dto);
  }

  @Get('careers/:careerId/curricula')
  @ApiOperation({ summary: 'List curricula for a career' })
  @ApiParam({ name: 'careerId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [CurriculumResponseDto] })
  findAll(
    @Req() req: Request,
    @Param('careerId', ParseUUIDPipe) careerId: string,
  ): Promise<CurriculumResponseDto[]> {
    return this.listCurricula.execute(careerId, req.tenantId!);
  }

  @Get('curricula/:id')
  @ApiOperation({ summary: 'Get a curriculum by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CurriculumResponseDto })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CurriculumResponseDto> {
    return this.getCurriculum.execute(id, req.tenantId!);
  }

  @Put('curricula/:id')
  @ApiOperation({ summary: 'Update a curriculum' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CurriculumResponseDto })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCurriculumDto,
  ): Promise<CurriculumResponseDto> {
    return this.updateCurriculum.execute(id, req.tenantId!, dto);
  }

  @Patch('curricula/:id/activate')
  @ApiOperation({ summary: 'Activate a curriculum' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CurriculumResponseDto })
  activate(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CurriculumResponseDto> {
    return this.activateCurriculum.execute(id, req.tenantId!);
  }

  @Patch('curricula/:id/archive')
  @ApiOperation({ summary: 'Archive a curriculum' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CurriculumResponseDto })
  archive(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CurriculumResponseDto> {
    return this.archiveCurriculum.execute(id, req.tenantId!);
  }

  @Delete('curricula/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a curriculum' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204 })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteCurriculum.execute(id, req.tenantId!);
  }

  @Get('curricula/:id/path')
  @ApiOperation({
    summary: 'Simulate academic path',
    description:
      'Returns each subject classified as COMPLETED, AVAILABLE (all prerequisites met), or LOCKED.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CurriculumPathResponseDto })
  path(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('completed') completed: string | string[] = [],
  ): Promise<CurriculumPathResponseDto> {
    const completedIds = Array.isArray(completed) ? completed : completed ? [completed] : [];
    return this.getPath.execute(id, req.tenantId!, completedIds);
  }

  @Get('curricula/:id/compare')
  @ApiOperation({
    summary: 'Compare two curriculum versions',
    description: 'Diffs subjects between curriculum A (:id) and curriculum B (?with=uuid): ADDED, REMOVED, MODIFIED, UNCHANGED.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CurriculumCompareResponseDto })
  compare(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('with', ParseUUIDPipe) otherId: string,
  ): Promise<CurriculumCompareResponseDto> {
    return this.compareCurricula.execute(id, otherId, req.tenantId!);
  }

  @Get('curricula/:id/redundancies')
  @ApiOperation({
    summary: 'Detect subject redundancies in a curriculum',
    description: 'Finds groups of subjects that cover the exact same set of competencies.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CurriculumRedundanciesResponseDto })
  redundancies(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CurriculumRedundanciesResponseDto> {
    return this.findRedundancies.execute(id, req.tenantId!);
  }

  @Get('curricula/:id/malla-pdf')
  @ApiOperation({ summary: 'Download malla curricular as PDF' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'PDF file (application/pdf)' })
  async mallaPdfDownload(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeContent') includeContentStr = 'true',
    @Res() res: Response,
  ): Promise<void> {
    const includeContent = includeContentStr !== 'false';
    const buffer = await this.mallaPdf.generate(id, req.tenantId!, includeContent);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="malla-curricular-${id}.pdf"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Get('curricula/:id/malla-excel')
  @ApiOperation({ summary: 'Download malla curricular as Excel (.xlsx)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)' })
  async mallaExcelDownload(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.mallaExcel.generate(id, req.tenantId!);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="malla-curricular-${id}.xlsx"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}
