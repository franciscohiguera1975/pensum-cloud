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
  Req,
  UseGuards,
} from '@nestjs/common';
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
  CreateSubjectDto,
  MoveSubjectDto,
  ReorderSubjectDto,
  SubjectResponseDto,
  UpdateSubjectDto,
} from '../../application/dto/subject.dto';
import {
  CreateSubjectUseCase,
  DeleteSubjectUseCase,
  GetSubjectUseCase,
  ListSubjectsUseCase,
  MoveSubjectUseCase,
  ReorderSubjectUseCase,
  UpdateSubjectUseCase,
} from '../../application/use-cases/subject.use-cases';

@ApiTags('Subjects')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller()
export class SubjectsController {
  constructor(
    private readonly createSubject: CreateSubjectUseCase,
    private readonly getSubject: GetSubjectUseCase,
    private readonly listSubjects: ListSubjectsUseCase,
    private readonly updateSubject: UpdateSubjectUseCase,
    private readonly deleteSubject: DeleteSubjectUseCase,
    private readonly moveSubject: MoveSubjectUseCase,
    private readonly reorderSubject: ReorderSubjectUseCase,
  ) {}

  @Post('semesters/:semesterId/subjects')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subject within a semester' })
  @ApiParam({ name: 'semesterId', format: 'uuid' })
  @ApiResponse({ status: 201, type: SubjectResponseDto })
  @ApiResponse({ status: 409, description: 'Subject code already exists' })
  create(
    @Req() req: Request,
    @Param('semesterId', ParseUUIDPipe) semesterId: string,
    @Body() dto: CreateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.createSubject.execute(req.tenantId!, semesterId, dto);
  }

  @Get('semesters/:semesterId/subjects')
  @ApiOperation({ summary: 'List subjects in a semester' })
  @ApiParam({ name: 'semesterId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [SubjectResponseDto] })
  findAll(
    @Req() req: Request,
    @Param('semesterId', ParseUUIDPipe) semesterId: string,
  ): Promise<SubjectResponseDto[]> {
    return this.listSubjects.execute(semesterId, req.tenantId!);
  }

  @Get('subjects/:id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SubjectResponseDto })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectResponseDto> {
    return this.getSubject.execute(id, req.tenantId!);
  }

  @Put('subjects/:id')
  @ApiOperation({ summary: 'Update a subject' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SubjectResponseDto })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.updateSubject.execute(id, req.tenantId!, dto);
  }

  @Delete('subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a subject' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204 })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteSubject.execute(id, req.tenantId!);
  }

  @Patch('subjects/:id/move')
  @ApiOperation({ summary: 'Move a subject to a different semester' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SubjectResponseDto })
  move(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.moveSubject.execute(id, req.tenantId!, dto);
  }

  @Patch('subjects/:id/reorder')
  @ApiOperation({ summary: 'Move and/or reorder a subject within or between semesters' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SubjectResponseDto })
  reorder(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.reorderSubject.execute(id, req.tenantId!, dto);
  }
}
