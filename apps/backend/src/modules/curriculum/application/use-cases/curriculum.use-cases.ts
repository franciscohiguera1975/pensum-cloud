import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Curriculum } from '../../domain/entities/curriculum.entity';
import {
  CURRICULUM_REPOSITORY,
  ICurriculumRepository,
} from '../../domain/repositories/curriculum.repository.interface';
import { CreateCurriculumDto, CurriculumResponseDto, UpdateCurriculumDto } from '../dto/curriculum.dto';

function toDto(c: Curriculum): CurriculumResponseDto {
  return {
    id: c.id,
    tenantId: c.tenantId,
    careerId: c.careerId,
    version: c.version,
    name: c.name,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

@Injectable()
export class CreateCurriculumUseCase {
  constructor(@Inject(CURRICULUM_REPOSITORY) private readonly repo: ICurriculumRepository) {}

  async execute(tenantId: string, careerId: string, dto: CreateCurriculumDto): Promise<CurriculumResponseDto> {
    const exists = await this.repo.existsByVersion(careerId, dto.version, tenantId);
    if (exists) throw new ConflictException(`Version ${dto.version} already exists for this career`);

    const curriculum = Curriculum.create({ tenantId, careerId, ...dto });
    const saved = await this.repo.save(curriculum);
    return toDto(saved);
  }
}

@Injectable()
export class GetCurriculumUseCase {
  constructor(@Inject(CURRICULUM_REPOSITORY) private readonly repo: ICurriculumRepository) {}

  async execute(id: string, tenantId: string): Promise<CurriculumResponseDto> {
    const curriculum = await this.repo.findById(id, tenantId);
    if (!curriculum) throw new NotFoundException(`Curriculum ${id} not found`);
    return toDto(curriculum);
  }
}

@Injectable()
export class ListCurriculaUseCase {
  constructor(@Inject(CURRICULUM_REPOSITORY) private readonly repo: ICurriculumRepository) {}

  async execute(careerId: string, tenantId: string): Promise<CurriculumResponseDto[]> {
    const curricula = await this.repo.findAllByCareer(careerId, tenantId);
    return curricula.map(toDto);
  }
}

@Injectable()
export class UpdateCurriculumUseCase {
  constructor(@Inject(CURRICULUM_REPOSITORY) private readonly repo: ICurriculumRepository) {}

  async execute(id: string, tenantId: string, dto: UpdateCurriculumDto): Promise<CurriculumResponseDto> {
    const curriculum = await this.repo.findById(id, tenantId);
    if (!curriculum) throw new NotFoundException(`Curriculum ${id} not found`);

    curriculum.update(dto);
    const updated = await this.repo.update(curriculum);
    return toDto(updated);
  }
}

@Injectable()
export class ActivateCurriculumUseCase {
  constructor(@Inject(CURRICULUM_REPOSITORY) private readonly repo: ICurriculumRepository) {}

  async execute(id: string, tenantId: string): Promise<CurriculumResponseDto> {
    const curriculum = await this.repo.findById(id, tenantId);
    if (!curriculum) throw new NotFoundException(`Curriculum ${id} not found`);

    curriculum.activate();
    const updated = await this.repo.update(curriculum);
    return toDto(updated);
  }
}

@Injectable()
export class ArchiveCurriculumUseCase {
  constructor(@Inject(CURRICULUM_REPOSITORY) private readonly repo: ICurriculumRepository) {}

  async execute(id: string, tenantId: string): Promise<CurriculumResponseDto> {
    const curriculum = await this.repo.findById(id, tenantId);
    if (!curriculum) throw new NotFoundException(`Curriculum ${id} not found`);

    curriculum.archive();
    const updated = await this.repo.update(curriculum);
    return toDto(updated);
  }
}

@Injectable()
export class DeleteCurriculumUseCase {
  constructor(@Inject(CURRICULUM_REPOSITORY) private readonly repo: ICurriculumRepository) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const curriculum = await this.repo.findById(id, tenantId);
    if (!curriculum) throw new NotFoundException(`Curriculum ${id} not found`);

    curriculum.softDelete();
    await this.repo.update(curriculum);
  }
}
