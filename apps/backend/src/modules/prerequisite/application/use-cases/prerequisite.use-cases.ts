import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prerequisite } from '../../domain/entities/prerequisite.entity';
import {
  IPrerequisiteRepository,
  PREREQUISITE_REPOSITORY,
} from '../../domain/repositories/prerequisite.repository.interface';
import { AddPrerequisiteDto, PrerequisiteResponseDto } from '../dto/prerequisite.dto';

function toDto(p: Prerequisite): PrerequisiteResponseDto {
  return {
    subjectId: p.subjectId,
    requiresId: p.requiresId,
    tenantId: p.tenantId,
    createdAt: p.createdAt,
  };
}

@Injectable()
export class AddPrerequisiteUseCase {
  constructor(@Inject(PREREQUISITE_REPOSITORY) private readonly repo: IPrerequisiteRepository) {}

  async execute(tenantId: string, subjectId: string, dto: AddPrerequisiteDto): Promise<PrerequisiteResponseDto> {
    const exists = await this.repo.exists(subjectId, dto.requiresId, tenantId);
    if (exists) throw new ConflictException('This prerequisite relationship already exists');

    const prerequisite = Prerequisite.create({ subjectId, requiresId: dto.requiresId, tenantId });
    const saved = await this.repo.save(prerequisite);
    return toDto(saved);
  }
}

@Injectable()
export class RemovePrerequisiteUseCase {
  constructor(@Inject(PREREQUISITE_REPOSITORY) private readonly repo: IPrerequisiteRepository) {}

  async execute(tenantId: string, subjectId: string, requiresId: string): Promise<void> {
    const exists = await this.repo.exists(subjectId, requiresId, tenantId);
    if (!exists) throw new NotFoundException('Prerequisite relationship not found');

    await this.repo.delete(subjectId, requiresId, tenantId);
  }
}

@Injectable()
export class ListPrerequisitesUseCase {
  constructor(@Inject(PREREQUISITE_REPOSITORY) private readonly repo: IPrerequisiteRepository) {}

  async execute(subjectId: string, tenantId: string): Promise<PrerequisiteResponseDto[]> {
    const prerequisites = await this.repo.findBySubject(subjectId, tenantId);
    return prerequisites.map(toDto);
  }
}
