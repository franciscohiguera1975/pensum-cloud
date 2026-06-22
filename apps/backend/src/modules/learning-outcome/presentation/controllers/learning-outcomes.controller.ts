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
  CreateLearningOutcomeUseCase,
  GetLearningOutcomeUseCase,
  UpdateLearningOutcomeUseCase,
  DeleteLearningOutcomeUseCase,
} from '../../application/use-cases/learning-outcome.use-cases';
import {
  CreateLearningOutcomeDto,
  UpdateLearningOutcomeDto,
} from '../../application/dto/learning-outcome.dto';

@ApiTags('Learning Outcomes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('learning-outcomes')
export class LearningOutcomesController {
  constructor(
    private readonly create: CreateLearningOutcomeUseCase,
    private readonly get: GetLearningOutcomeUseCase,
    private readonly update: UpdateLearningOutcomeUseCase,
    private readonly remove: DeleteLearningOutcomeUseCase,
  ) {}

  @Post()
  createOne(@Body() dto: CreateLearningOutcomeDto, @Req() req: Request) {
    return this.create.execute(dto, req.tenantId!);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.get.execute(id, req.tenantId!);
  }

  @Put(':id')
  updateOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearningOutcomeDto,
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
