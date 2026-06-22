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
  AddPrerequisiteDto,
  PrerequisiteResponseDto,
} from '../../application/dto/prerequisite.dto';
import {
  AddPrerequisiteUseCase,
  ListPrerequisitesUseCase,
  RemovePrerequisiteUseCase,
} from '../../application/use-cases/prerequisite.use-cases';

@ApiTags('Prerequisites')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('subjects/:subjectId/prerequisites')
export class PrerequisitesController {
  constructor(
    private readonly addPrerequisite: AddPrerequisiteUseCase,
    private readonly removePrerequisite: RemovePrerequisiteUseCase,
    private readonly listPrerequisites: ListPrerequisitesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a prerequisite to a subject' })
  @ApiParam({ name: 'subjectId', format: 'uuid' })
  @ApiResponse({ status: 201, type: PrerequisiteResponseDto })
  @ApiResponse({ status: 409, description: 'Prerequisite already exists' })
  add(
    @Req() req: Request,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Body() dto: AddPrerequisiteDto,
  ): Promise<PrerequisiteResponseDto> {
    return this.addPrerequisite.execute(req.tenantId!, subjectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List prerequisites of a subject' })
  @ApiParam({ name: 'subjectId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PrerequisiteResponseDto] })
  findAll(
    @Req() req: Request,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
  ): Promise<PrerequisiteResponseDto[]> {
    return this.listPrerequisites.execute(subjectId, req.tenantId!);
  }

  @Delete(':requiresId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a prerequisite from a subject' })
  @ApiParam({ name: 'subjectId', format: 'uuid' })
  @ApiParam({ name: 'requiresId', format: 'uuid' })
  @ApiResponse({ status: 204 })
  remove(
    @Req() req: Request,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Param('requiresId', ParseUUIDPipe) requiresId: string,
  ): Promise<void> {
    return this.removePrerequisite.execute(req.tenantId!, subjectId, requiresId);
  }
}
