import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Faculty } from '../../domain/entities/faculty.entity';
import {
  FACULTY_REPOSITORY,
  IFacultyRepository,
} from '../../domain/repositories/faculty.repository.interface';
import {
  CreateFacultyDto,
  FacultyResponseDto,
  UpdateFacultyDto,
} from '../dto/faculty.dto';

// ── Create ────────────────────────────────────────────────────────────────────
@Injectable()
export class CreateFacultyUseCase {
  constructor(
    @Inject(FACULTY_REPOSITORY) private readonly repo: IFacultyRepository,
  ) {}

  async execute(
    tenantId: string,
    universityId: string,
    dto: CreateFacultyDto,
  ): Promise<FacultyResponseDto> {
    const exists = await this.repo.existsByCode(dto.code, universityId);
    if (exists) {
      throw new ConflictException(
        `Faculty with code "${dto.code}" already exists in this university`,
      );
    }
    const faculty = Faculty.create({ tenantId, universityId, name: dto.name, code: dto.code });
    return FacultyResponseDto.fromDomain(await this.repo.save(faculty));
  }
}

// ── Get ───────────────────────────────────────────────────────────────────────
@Injectable()
export class GetFacultyUseCase {
  constructor(
    @Inject(FACULTY_REPOSITORY) private readonly repo: IFacultyRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<FacultyResponseDto> {
    const faculty = await this.repo.findById(id, tenantId);
    if (!faculty) throw new NotFoundException(`Faculty "${id}" not found`);
    return FacultyResponseDto.fromDomain(faculty);
  }
}

// ── List ──────────────────────────────────────────────────────────────────────
@Injectable()
export class ListFacultiesUseCase {
  constructor(
    @Inject(FACULTY_REPOSITORY) private readonly repo: IFacultyRepository,
  ) {}

  async execute(universityId: string, tenantId: string): Promise<FacultyResponseDto[]> {
    const faculties = await this.repo.findAllByUniversity(universityId, tenantId);
    return faculties.map(FacultyResponseDto.fromDomain);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
@Injectable()
export class UpdateFacultyUseCase {
  constructor(
    @Inject(FACULTY_REPOSITORY) private readonly repo: IFacultyRepository,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    dto: UpdateFacultyDto,
  ): Promise<FacultyResponseDto> {
    const faculty = await this.repo.findById(id, tenantId);
    if (!faculty) throw new NotFoundException(`Faculty "${id}" not found`);

    if (dto.code !== undefined) {
      const normalizedCode = dto.code.trim().toUpperCase();
      if (normalizedCode !== faculty.code) {
        const exists = await this.repo.existsByCode(
          normalizedCode,
          faculty.universityId,
          faculty.id,
        );
        if (exists) {
          throw new ConflictException(
            `Faculty with code "${normalizedCode}" already exists in this university`,
          );
        }
      }
    }

    faculty.update({ name: dto.name, code: dto.code });
    return FacultyResponseDto.fromDomain(await this.repo.update(faculty));
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
@Injectable()
export class DeleteFacultyUseCase {
  constructor(
    @Inject(FACULTY_REPOSITORY) private readonly repo: IFacultyRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const faculty = await this.repo.findById(id, tenantId);
    if (!faculty) throw new NotFoundException(`Faculty "${id}" not found`);
    faculty.softDelete();
    await this.repo.update(faculty);
  }
}
