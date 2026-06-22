import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Subject } from '../../domain/entities/subject.entity';
import {
  ISubjectRepository,
  SUBJECT_REPOSITORY,
} from '../../domain/repositories/subject.repository.interface';
import { CreateSubjectDto, MoveSubjectDto, ReorderSubjectDto, SubjectResponseDto, UpdateSubjectDto } from '../dto/subject.dto';

function toDto(s: Subject): SubjectResponseDto {
  return {
    id: s.id,
    tenantId: s.tenantId,
    semesterId: s.semesterId,
    name: s.name,
    code: s.code,
    credits: s.credits,
    hoursTheory: s.hoursTheory,
    hoursPractice: s.hoursPractice,
    description: s.description,
    position: s.position,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

@Injectable()
export class CreateSubjectUseCase {
  constructor(@Inject(SUBJECT_REPOSITORY) private readonly repo: ISubjectRepository) {}

  async execute(tenantId: string, semesterId: string, dto: CreateSubjectDto): Promise<SubjectResponseDto> {
    const exists = await this.repo.existsByCode(semesterId, dto.code, tenantId);
    if (exists) throw new ConflictException(`Subject code ${dto.code} already exists in this semester`);

    const subject = Subject.create({ tenantId, semesterId, ...dto });
    const saved = await this.repo.save(subject);
    return toDto(saved);
  }
}

@Injectable()
export class GetSubjectUseCase {
  constructor(@Inject(SUBJECT_REPOSITORY) private readonly repo: ISubjectRepository) {}

  async execute(id: string, tenantId: string): Promise<SubjectResponseDto> {
    const subject = await this.repo.findById(id, tenantId);
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);
    return toDto(subject);
  }
}

@Injectable()
export class ListSubjectsUseCase {
  constructor(@Inject(SUBJECT_REPOSITORY) private readonly repo: ISubjectRepository) {}

  async execute(semesterId: string, tenantId: string): Promise<SubjectResponseDto[]> {
    const subjects = await this.repo.findAllBySemester(semesterId, tenantId);
    return subjects.map(toDto);
  }
}

@Injectable()
export class UpdateSubjectUseCase {
  constructor(@Inject(SUBJECT_REPOSITORY) private readonly repo: ISubjectRepository) {}

  async execute(id: string, tenantId: string, dto: UpdateSubjectDto): Promise<SubjectResponseDto> {
    const subject = await this.repo.findById(id, tenantId);
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);

    subject.update(dto);
    const updated = await this.repo.update(subject);
    return toDto(updated);
  }
}

@Injectable()
export class DeleteSubjectUseCase {
  constructor(@Inject(SUBJECT_REPOSITORY) private readonly repo: ISubjectRepository) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const subject = await this.repo.findById(id, tenantId);
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);

    subject.softDelete();
    await this.repo.update(subject);
  }
}

@Injectable()
export class MoveSubjectUseCase {
  constructor(@Inject(SUBJECT_REPOSITORY) private readonly repo: ISubjectRepository) {}

  async execute(id: string, tenantId: string, dto: MoveSubjectDto): Promise<SubjectResponseDto> {
    const subject = await this.repo.findById(id, tenantId);
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);

    subject.moveTo(dto.semesterId);
    const updated = await this.repo.update(subject);
    return toDto(updated);
  }
}

@Injectable()
export class ReorderSubjectUseCase {
  constructor(@Inject(SUBJECT_REPOSITORY) private readonly repo: ISubjectRepository) {}

  async execute(id: string, tenantId: string, dto: ReorderSubjectDto): Promise<SubjectResponseDto> {
    const subject = await this.repo.findById(id, tenantId);
    if (!subject) throw new NotFoundException(`Subject ${id} not found`);

    // Get all subjects in the target semester excluding the one being moved
    const siblings = await this.repo.findAllBySemester(dto.semesterId, tenantId);
    const withoutSelf = siblings
      .filter((s) => s.id !== id)
      .sort((a, b) => a.position - b.position);

    // Clamp position and insert
    const targetPos = Math.max(0, Math.min(dto.position, withoutSelf.length));
    withoutSelf.splice(targetPos, 0, subject);

    // If moving to a different semester, update semesterId first
    if (subject.semesterId !== dto.semesterId) {
      subject.moveTo(dto.semesterId);
      await this.repo.update(subject);
    }

    // Reassign sequential positions
    const orderedIds = withoutSelf.map((s) => s.id);
    await this.repo.reorderInSemester(tenantId, dto.semesterId, orderedIds);

    // Return updated subject (reload to get fresh position)
    const updated = await this.repo.findById(id, tenantId);
    return toDto(updated!);
  }
}
