import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { University } from '../../domain/entities/university.entity';
import {
  IUniversityRepository,
  UNIVERSITY_REPOSITORY,
} from '../../domain/repositories/university.repository.interface';
import { CreateUniversityDto } from '../dto/create-university.dto';
import { UniversityResponseDto } from '../dto/university-response.dto';

@Injectable()
export class CreateUniversityUseCase {
  constructor(
    @Inject(UNIVERSITY_REPOSITORY)
    private readonly repo: IUniversityRepository,
  ) {}

  async execute(
    tenantId: string,
    dto: CreateUniversityDto,
  ): Promise<UniversityResponseDto> {
    const codeExists = await this.repo.existsByCode(dto.code, tenantId);
    if (codeExists) {
      throw new ConflictException(
        `University with code "${dto.code}" already exists`,
      );
    }

    const university = University.create({
      tenantId,
      name: dto.name,
      code: dto.code,
      country: dto.country,
      website: dto.website,
    });

    const saved = await this.repo.save(university);
    return UniversityResponseDto.fromDomain(saved);
  }
}
