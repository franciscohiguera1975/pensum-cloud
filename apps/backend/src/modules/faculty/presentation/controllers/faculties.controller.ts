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
  CreateFacultyDto,
  FacultyResponseDto,
  UpdateFacultyDto,
} from '../../application/dto/faculty.dto';
import {
  CreateFacultyUseCase,
  DeleteFacultyUseCase,
  GetFacultyUseCase,
  ListFacultiesUseCase,
  UpdateFacultyUseCase,
} from '../../application/use-cases/faculty.use-cases';

@ApiTags('Faculties')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('universities/:universityId/faculties')
export class FacultiesController {
  constructor(
    private readonly createFaculty: CreateFacultyUseCase,
    private readonly getFaculty: GetFacultyUseCase,
    private readonly listFaculties: ListFacultiesUseCase,
    private readonly updateFaculty: UpdateFacultyUseCase,
    private readonly deleteFaculty: DeleteFacultyUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a faculty within a university' })
  @ApiParam({ name: 'universityId', format: 'uuid' })
  @ApiResponse({ status: 201, type: FacultyResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  create(
    @Req() req: Request,
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Body() dto: CreateFacultyDto,
  ): Promise<FacultyResponseDto> {
    return this.createFaculty.execute(req.tenantId!, universityId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List faculties for a university' })
  @ApiParam({ name: 'universityId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [FacultyResponseDto] })
  findAll(
    @Req() req: Request,
    @Param('universityId', ParseUUIDPipe) universityId: string,
  ): Promise<FacultyResponseDto[]> {
    return this.listFaculties.execute(universityId, req.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a faculty by ID' })
  @ApiParam({ name: 'universityId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: FacultyResponseDto })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FacultyResponseDto> {
    return this.getFaculty.execute(id, req.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a faculty' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: FacultyResponseDto })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFacultyDto,
  ): Promise<FacultyResponseDto> {
    return this.updateFaculty.execute(id, req.tenantId!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a faculty' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteFaculty.execute(id, req.tenantId!);
  }
}
