import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ILearningOutcomeRepository,
  LEARNING_OUTCOME_REPOSITORY,
} from '../../domain/repositories/learning-outcome.repository.interface';
import { LearningOutcome } from '../../domain/entities/learning-outcome.entity';
import {
  CreateLearningOutcomeDto,
  UpdateLearningOutcomeDto,
  LearningOutcomeResponseDto,
} from '../dto/learning-outcome.dto';
import { LearningOutcomeMapper } from '../../infrastructure/mappers/learning-outcome.mapper';

// ── Create ────────────────────────────────────────────────────────────────────

@Injectable()
export class CreateLearningOutcomeUseCase {
  constructor(
    @Inject(LEARNING_OUTCOME_REPOSITORY)
    private readonly repo: ILearningOutcomeRepository,
  ) {}

  async execute(
    dto: CreateLearningOutcomeDto,
    tenantId: string,
  ): Promise<LearningOutcomeResponseDto> {
    const lo = LearningOutcome.create({
      id: uuidv4(),
      tenantId,
      description: dto.description,
      code: dto.code,
      subjectId: dto.subjectId,
      competencyId: dto.competencyId,
    });
    await this.repo.save(lo);
    return LearningOutcomeMapper.toResponse(lo);
  }
}

// ── Get ───────────────────────────────────────────────────────────────────────

@Injectable()
export class GetLearningOutcomeUseCase {
  constructor(
    @Inject(LEARNING_OUTCOME_REPOSITORY)
    private readonly repo: ILearningOutcomeRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<LearningOutcomeResponseDto> {
    const lo = await this.repo.findById(id, tenantId);
    if (!lo) throw new NotFoundException(`LearningOutcome ${id} not found`);
    return LearningOutcomeMapper.toResponse(lo);
  }
}

// ── ListBySubject ─────────────────────────────────────────────────────────────

@Injectable()
export class ListLearningOutcomesBySubjectUseCase {
  constructor(
    @Inject(LEARNING_OUTCOME_REPOSITORY)
    private readonly repo: ILearningOutcomeRepository,
  ) {}

  async execute(subjectId: string, tenantId: string): Promise<LearningOutcomeResponseDto[]> {
    const list = await this.repo.findBySubject(subjectId, tenantId);
    return list.map(LearningOutcomeMapper.toResponse);
  }
}

// ── ListByCompetency ──────────────────────────────────────────────────────────

@Injectable()
export class ListLearningOutcomesByCompetencyUseCase {
  constructor(
    @Inject(LEARNING_OUTCOME_REPOSITORY)
    private readonly repo: ILearningOutcomeRepository,
  ) {}

  async execute(competencyId: string, tenantId: string): Promise<LearningOutcomeResponseDto[]> {
    const list = await this.repo.findByCompetency(competencyId, tenantId);
    return list.map(LearningOutcomeMapper.toResponse);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

@Injectable()
export class UpdateLearningOutcomeUseCase {
  constructor(
    @Inject(LEARNING_OUTCOME_REPOSITORY)
    private readonly repo: ILearningOutcomeRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateLearningOutcomeDto,
    tenantId: string,
  ): Promise<LearningOutcomeResponseDto> {
    const lo = await this.repo.findById(id, tenantId);
    if (!lo) throw new NotFoundException(`LearningOutcome ${id} not found`);
    lo.update(dto);
    await this.repo.update(lo);
    return LearningOutcomeMapper.toResponse(lo);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

@Injectable()
export class DeleteLearningOutcomeUseCase {
  constructor(
    @Inject(LEARNING_OUTCOME_REPOSITORY)
    private readonly repo: ILearningOutcomeRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const lo = await this.repo.findById(id, tenantId);
    if (!lo) throw new NotFoundException(`LearningOutcome ${id} not found`);
    lo.softDelete();
    await this.repo.delete(id, tenantId);
  }
}

export const LEARNING_OUTCOME_USE_CASES = [
  CreateLearningOutcomeUseCase,
  GetLearningOutcomeUseCase,
  ListLearningOutcomesBySubjectUseCase,
  ListLearningOutcomesByCompetencyUseCase,
  UpdateLearningOutcomeUseCase,
  DeleteLearningOutcomeUseCase,
];
