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
import { CreateUniversityDto } from '../../application/dto/create-university.dto';
import { UniversityResponseDto } from '../../application/dto/university-response.dto';
import { UpdateUniversityDto } from '../../application/dto/update-university.dto';
import { CreateUniversityUseCase } from '../../application/use-cases/create-university.use-case';
import { DeleteUniversityUseCase } from '../../application/use-cases/delete-university.use-case';
import { GetUniversityUseCase } from '../../application/use-cases/get-university.use-case';
import { ListUniversitiesUseCase } from '../../application/use-cases/list-universities.use-case';
import { UpdateUniversityUseCase } from '../../application/use-cases/update-university.use-case';

@ApiTags('Universities')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('universities')
export class UniversitiesController {
  constructor(
    private readonly createUniversity: CreateUniversityUseCase,
    private readonly getUniversity: GetUniversityUseCase,
    private readonly listUniversities: ListUniversitiesUseCase,
    private readonly updateUniversity: UpdateUniversityUseCase,
    private readonly deleteUniversity: DeleteUniversityUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a university' })
  @ApiResponse({ status: 201, type: UniversityResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  create(
    @Req() req: Request,
    @Body() dto: CreateUniversityDto,
  ): Promise<UniversityResponseDto> {
    return this.createUniversity.execute(req.tenantId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all universities for the tenant' })
  @ApiResponse({ status: 200, type: [UniversityResponseDto] })
  findAll(@Req() req: Request): Promise<UniversityResponseDto[]> {
    return this.listUniversities.execute(req.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a university by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: UniversityResponseDto })
  @ApiResponse({ status: 404, description: 'University not found' })
  findOne(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UniversityResponseDto> {
    return this.getUniversity.execute(id, req.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a university' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: UniversityResponseDto })
  @ApiResponse({ status: 404, description: 'University not found' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUniversityDto,
  ): Promise<UniversityResponseDto> {
    return this.updateUniversity.execute(id, req.tenantId!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a university' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'University not found' })
  remove(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.deleteUniversity.execute(id, req.tenantId!);
  }
}
