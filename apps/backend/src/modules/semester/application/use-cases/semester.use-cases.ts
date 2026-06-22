import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Semester } from '../../domain/entities/semester.entity';
import {
  ISemesterRepository,
  SEMESTER_REPOSITORY,
} from '../../domain/repositories/semester.repository.interface';
import { CreateSemesterDto, SemesterResponseDto, UpdateSemesterDto } from '../dto/semester.dto';

function toDto(s: Semester): SemesterResponseDto {
  return {
    id: s.id,
    tenantId: s.tenantId,
    curriculumId: s.curriculumId,
    number: s.number,
    name: s.name,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

@Injectable()
export class CreateSemesterUseCase {
  constructor(@Inject(SEMESTER_REPOSITORY) private readonly repo: ISemesterRepository) {}

  async execute(tenantId: string, curriculumId: string, dto: CreateSemesterDto): Promise<SemesterResponseDto> {
    const exists = await this.repo.existsByNumber(curriculumId, dto.number, tenantId);
    if (exists) throw new ConflictException(`Semester number ${dto.number} already exists in this curriculum`);

    const semester = Semester.create({ tenantId, curriculumId, ...dto });
    const saved = await this.repo.save(semester);
    return toDto(saved);
  }
}

@Injectable()
export class GetSemesterUseCase {
  constructor(@Inject(SEMESTER_REPOSITORY) private readonly repo: ISemesterRepository) {}

  async execute(id: string, tenantId: string): Promise<SemesterResponseDto> {
    const semester = await this.repo.findById(id, tenantId);
    if (!semester) throw new NotFoundException(`Semester ${id} not found`);
    return toDto(semester);
  }
}

@Injectable()
export class ListSemestersUseCase {
  constructor(@Inject(SEMESTER_REPOSITORY) private readonly repo: ISemesterRepository) {}

  async execute(curriculumId: string, tenantId: string): Promise<SemesterResponseDto[]> {
    const semesters = await this.repo.findAllByCurriculum(curriculumId, tenantId);
    return semesters.map(toDto);
  }
}

@Injectable()
export class UpdateSemesterUseCase {
  constructor(@Inject(SEMESTER_REPOSITORY) private readonly repo: ISemesterRepository) {}

  async execute(id: string, tenantId: string, dto: UpdateSemesterDto): Promise<SemesterResponseDto> {
    const semester = await this.repo.findById(id, tenantId);
    if (!semester) throw new NotFoundException(`Semester ${id} not found`);

    semester.update(dto);
    const updated = await this.repo.update(semester);
    return toDto(updated);
  }
}

@Injectable()
export class DeleteSemesterUseCase {
  constructor(@Inject(SEMESTER_REPOSITORY) private readonly repo: ISemesterRepository) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const semester = await this.repo.findById(id, tenantId);
    if (!semester) throw new NotFoundException(`Semester ${id} not found`);

    semester.softDelete();
    await this.repo.update(semester);
  }
}
