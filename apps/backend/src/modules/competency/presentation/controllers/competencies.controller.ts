import {
  Controller,
  Get,
  Post,
  Put,
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
  CreateCompetencyUseCase,
  GetCompetencyUseCase,
  ListCompetenciesUseCase,
  UpdateCompetencyUseCase,
  DeleteCompetencyUseCase,
} from '../../application/use-cases/competency.use-cases';
import { CreateCompetencyDto, UpdateCompetencyDto } from '../../application/dto/competency.dto';

@ApiTags('Competencies')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('competencies')
export class CompetenciesController {
  constructor(
    private readonly create: CreateCompetencyUseCase,
    private readonly get: GetCompetencyUseCase,
    private readonly list: ListCompetenciesUseCase,
    private readonly update: UpdateCompetencyUseCase,
    private readonly remove: DeleteCompetencyUseCase,
  ) {}

  @Post()
  createOne(@Body() dto: CreateCompetencyDto, @Req() req: Request) {
    return this.create.execute(dto, req.tenantId!);
  }

  @Get()
  listAll(@Req() req: Request) {
    return this.list.execute(req.tenantId!);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.get.execute(id, req.tenantId!);
  }

  @Put(':id')
  updateOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompetencyDto,
    @Req() req: Request,
  ) {
    return this.update.execute(id, dto, req.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.remove.execute(id, req.tenantId!);
  }
}
