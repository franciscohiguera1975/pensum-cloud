import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  CreateSemesterDto,
  SemesterResponseDto,
  UpdateSemesterDto,
} from '../../application/dto/semester.dto';
import {
  CreateSemesterUseCase,
  DeleteSemesterUseCase,
  GetSemesterUseCase,
  ListSemestersUseCase,
  UpdateSemesterUseCase,
} from '../../application/use-cases/semester.use-cases';

@ApiTags('Semesters')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller()
export class SemestersController {
  constructor(
    private readonly createSemester: CreateSemesterUseCase,
    private readonly getSemester: GetSemesterUseCase,
    private readonly listSemesters: ListSemestersUseCase,
    private readonly updateSemester: UpdateSemesterUseCase,
    private readonly deleteSemester: DeleteSemesterUseCase,
  ) {}

  @Post('curricula/:curriculumId/semesters')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a semester within a curriculum' })
  @ApiParam({ name: 'curriculumId', format: 'uuid' })
  @ApiResponse({ status: 201, type: SemesterResponseDto })
  @ApiResponse({ status: 409, description: 'Semester number already exists' })
  create(
    @Req() req: Request,
    @Param('curriculumId', ParseUUIDPipe) curriculumId: string,
    @Body() dto: CreateSemesterDto,
  ): Promise<SemesterResponseDto> {
    return this.createSemester.execute(req.tenantId!, curriculumId, dto);
  }

  @Get('curricula/:curriculumId/semesters')
  @ApiOperation({ summary: 'List semesters in a curriculum' })
  @ApiParam({ name: 'curriculumId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [SemesterResponseDto] })
  findAll(
    @Req() req: Request,
    @Param('curriculumId', ParseUUIDPipe) curriculumId: string,
  ): Promise<SemesterResponseDto[]> {
    return this.listSemesters.execute(curriculumId, req.tenantId!);
  }

  @Get('semesters/:id')
  @ApiOperation({ summary: 'Get a semester by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SemesterResponseDto })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SemesterResponseDto> {
    return this.getSemester.execute(id, req.tenantId!);
  }

  @Put('semesters/:id')
  @ApiOperation({ summary: 'Update a semester' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: SemesterResponseDto })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSemesterDto,
  ): Promise<SemesterResponseDto> {
    return this.updateSemester.execute(id, req.tenantId!, dto);
  }

  @Delete('semesters/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a semester' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204 })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteSemester.execute(id, req.tenantId!);
  }
}
