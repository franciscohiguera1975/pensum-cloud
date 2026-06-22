import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Career } from '../../domain/entities/career.entity';
import {
  CAREER_REPOSITORY,
  ICareerRepository,
} from '../../domain/repositories/career.repository.interface';
import {
  CareerResponseDto,
  CreateCareerDto,
  UpdateCareerDto,
} from '../dto/career.dto';

// ── Create ────────────────────────────────────────────────────────────────────
@Injectable()
export class CreateCareerUseCase {
  constructor(
    @Inject(CAREER_REPOSITORY) private readonly repo: ICareerRepository,
  ) {}

  async execute(
    tenantId: string,
    facultyId: string,
    dto: CreateCareerDto,
  ): Promise<CareerResponseDto> {
    const exists = await this.repo.existsByCode(dto.code, facultyId);
    if (exists) {
      throw new ConflictException(
        `Career with code "${dto.code}" already exists in this faculty`,
      );
    }
    const career = Career.create({
      tenantId,
      facultyId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
    });
    return CareerResponseDto.fromDomain(await this.repo.save(career));
  }
}

// ── Get ───────────────────────────────────────────────────────────────────────
@Injectable()
export class GetCareerUseCase {
  constructor(
    @Inject(CAREER_REPOSITORY) private readonly repo: ICareerRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<CareerResponseDto> {
    const career = await this.repo.findById(id, tenantId);
    if (!career) throw new NotFoundException(`Career "${id}" not found`);
    return CareerResponseDto.fromDomain(career);
  }
}

// ── List ──────────────────────────────────────────────────────────────────────
@Injectable()
export class ListCareersUseCase {
  constructor(
    @Inject(CAREER_REPOSITORY) private readonly repo: ICareerRepository,
  ) {}

  async execute(facultyId: string, tenantId: string): Promise<CareerResponseDto[]> {
    const careers = await this.repo.findAllByFaculty(facultyId, tenantId);
    return careers.map(CareerResponseDto.fromDomain);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
@Injectable()
export class UpdateCareerUseCase {
  constructor(
    @Inject(CAREER_REPOSITORY) private readonly repo: ICareerRepository,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    dto: UpdateCareerDto,
  ): Promise<CareerResponseDto> {
    const career = await this.repo.findById(id, tenantId);
    if (!career) throw new NotFoundException(`Career "${id}" not found`);
    career.update({ name: dto.name, description: dto.description });
    return CareerResponseDto.fromDomain(await this.repo.update(career));
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
@Injectable()
export class DeleteCareerUseCase {
  constructor(
    @Inject(CAREER_REPOSITORY) private readonly repo: ICareerRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const career = await this.repo.findById(id, tenantId);
    if (!career) throw new NotFoundException(`Career "${id}" not found`);
    career.softDelete();
    await this.repo.update(career);
  }
}
