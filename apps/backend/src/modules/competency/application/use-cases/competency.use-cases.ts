import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ICompetencyRepository,
  COMPETENCY_REPOSITORY,
} from '../../domain/repositories/competency.repository.interface';
import { Competency } from '../../domain/entities/competency.entity';
import {
  CreateCompetencyDto,
  UpdateCompetencyDto,
  CompetencyResponseDto,
} from '../dto/competency.dto';
import { CompetencyMapper } from '../../infrastructure/mappers/competency.mapper';

// ── SubjectCompetency repository for link/unlink ──────────────────────────────
export const SUBJECT_COMPETENCY_REPOSITORY = Symbol('SUBJECT_COMPETENCY_REPOSITORY');

export interface ISubjectCompetencyRepository {
  exists(subjectId: string, competencyId: string): Promise<boolean>;
  link(subjectId: string, competencyId: string): Promise<void>;
  unlink(subjectId: string, competencyId: string): Promise<void>;
  findBySubject(subjectId: string): Promise<Competency[]>;
}

// ── Create ────────────────────────────────────────────────────────────────────

@Injectable()
export class CreateCompetencyUseCase {
  constructor(
    @Inject(COMPETENCY_REPOSITORY)
    private readonly repo: ICompetencyRepository,
  ) {}

  async execute(dto: CreateCompetencyDto, tenantId: string): Promise<CompetencyResponseDto> {
    if (dto.code) {
      const exists = await this.repo.existsByCode(dto.code, tenantId);
      if (exists) throw new ConflictException(`Competency code '${dto.code}' already exists`);
    }

    const competency = Competency.create({
      id: uuidv4(),
      tenantId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
    });

    await this.repo.save(competency);
    return CompetencyMapper.toResponse(competency);
  }
}

// ── Get ───────────────────────────────────────────────────────────────────────

@Injectable()
export class GetCompetencyUseCase {
  constructor(
    @Inject(COMPETENCY_REPOSITORY)
    private readonly repo: ICompetencyRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<CompetencyResponseDto> {
    const competency = await this.repo.findById(id, tenantId);
    if (!competency) throw new NotFoundException(`Competency ${id} not found`);
    return CompetencyMapper.toResponse(competency);
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

@Injectable()
export class ListCompetenciesUseCase {
  constructor(
    @Inject(COMPETENCY_REPOSITORY)
    private readonly repo: ICompetencyRepository,
  ) {}

  async execute(tenantId: string): Promise<CompetencyResponseDto[]> {
    const list = await this.repo.findAll(tenantId);
    return list.map(CompetencyMapper.toResponse);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

@Injectable()
export class UpdateCompetencyUseCase {
  constructor(
    @Inject(COMPETENCY_REPOSITORY)
    private readonly repo: ICompetencyRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateCompetencyDto,
    tenantId: string,
  ): Promise<CompetencyResponseDto> {
    const competency = await this.repo.findById(id, tenantId);
    if (!competency) throw new NotFoundException(`Competency ${id} not found`);

    if (dto.code) {
      const exists = await this.repo.existsByCode(dto.code, tenantId, id);
      if (exists) throw new ConflictException(`Competency code '${dto.code}' already exists`);
    }

    competency.update(dto);
    await this.repo.update(competency);
    return CompetencyMapper.toResponse(competency);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

@Injectable()
export class DeleteCompetencyUseCase {
  constructor(
    @Inject(COMPETENCY_REPOSITORY)
    private readonly repo: ICompetencyRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const competency = await this.repo.findById(id, tenantId);
    if (!competency) throw new NotFoundException(`Competency ${id} not found`);
    competency.softDelete();
    await this.repo.delete(id, tenantId);
  }
}

// ── AddCompetencyToSubject ────────────────────────────────────────────────────

@Injectable()
export class AddCompetencyToSubjectUseCase {
  constructor(
    @Inject(COMPETENCY_REPOSITORY)
    private readonly competencyRepo: ICompetencyRepository,
    @Inject(SUBJECT_COMPETENCY_REPOSITORY)
    private readonly linkRepo: ISubjectCompetencyRepository,
  ) {}

  async execute(subjectId: string, competencyId: string, tenantId: string): Promise<void> {
    const competency = await this.competencyRepo.findById(competencyId, tenantId);
    if (!competency) throw new NotFoundException(`Competency ${competencyId} not found`);

    const exists = await this.linkRepo.exists(subjectId, competencyId);
    if (exists) throw new ConflictException('Subject already has this competency');

    await this.linkRepo.link(subjectId, competencyId);
  }
}

// ── RemoveCompetencyFromSubject ───────────────────────────────────────────────

@Injectable()
export class RemoveCompetencyFromSubjectUseCase {
  constructor(
    @Inject(SUBJECT_COMPETENCY_REPOSITORY)
    private readonly linkRepo: ISubjectCompetencyRepository,
  ) {}

  async execute(subjectId: string, competencyId: string): Promise<void> {
    const exists = await this.linkRepo.exists(subjectId, competencyId);
    if (!exists) throw new NotFoundException('Subject does not have this competency');
    await this.linkRepo.unlink(subjectId, competencyId);
  }
}

// ── ListSubjectCompetencies ───────────────────────────────────────────────────

@Injectable()
export class ListSubjectCompetenciesUseCase {
  constructor(
    @Inject(SUBJECT_COMPETENCY_REPOSITORY)
    private readonly linkRepo: ISubjectCompetencyRepository,
  ) {}

  async execute(subjectId: string): Promise<CompetencyResponseDto[]> {
    const list = await this.linkRepo.findBySubject(subjectId);
    return list.map(CompetencyMapper.toResponse);
  }
}

export const COMPETENCY_USE_CASES = [
  CreateCompetencyUseCase,
  GetCompetencyUseCase,
  ListCompetenciesUseCase,
  UpdateCompetencyUseCase,
  DeleteCompetencyUseCase,
  AddCompetencyToSubjectUseCase,
  RemoveCompetencyFromSubjectUseCase,
  ListSubjectCompetenciesUseCase,
];
