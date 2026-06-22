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
  CareerResponseDto,
  CreateCareerDto,
  UpdateCareerDto,
} from '../../application/dto/career.dto';
import {
  CreateCareerUseCase,
  DeleteCareerUseCase,
  GetCareerUseCase,
  ListCareersUseCase,
  UpdateCareerUseCase,
} from '../../application/use-cases/career.use-cases';

@ApiTags('Careers')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('faculties/:facultyId/careers')
export class CareersController {
  constructor(
    private readonly createCareer: CreateCareerUseCase,
    private readonly getCareer: GetCareerUseCase,
    private readonly listCareers: ListCareersUseCase,
    private readonly updateCareer: UpdateCareerUseCase,
    private readonly deleteCareer: DeleteCareerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a career within a faculty' })
  @ApiParam({ name: 'facultyId', format: 'uuid' })
  @ApiResponse({ status: 201, type: CareerResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  create(
    @Req() req: Request,
    @Param('facultyId', ParseUUIDPipe) facultyId: string,
    @Body() dto: CreateCareerDto,
  ): Promise<CareerResponseDto> {
    return this.createCareer.execute(req.tenantId!, facultyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List careers for a faculty' })
  @ApiParam({ name: 'facultyId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [CareerResponseDto] })
  findAll(
    @Req() req: Request,
    @Param('facultyId', ParseUUIDPipe) facultyId: string,
  ): Promise<CareerResponseDto[]> {
    return this.listCareers.execute(facultyId, req.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a career by ID' })
  @ApiParam({ name: 'facultyId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CareerResponseDto })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CareerResponseDto> {
    return this.getCareer.execute(id, req.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a career' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: CareerResponseDto })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareerDto,
  ): Promise<CareerResponseDto> {
    return this.updateCareer.execute(id, req.tenantId!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a career' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteCareer.execute(id, req.tenantId!);
  }
}
