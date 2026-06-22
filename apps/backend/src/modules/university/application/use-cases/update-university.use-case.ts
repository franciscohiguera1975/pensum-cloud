import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUniversityRepository,
  UNIVERSITY_REPOSITORY,
} from '../../domain/repositories/university.repository.interface';
import { UpdateUniversityDto } from '../dto/update-university.dto';
import { UniversityResponseDto } from '../dto/university-response.dto';

@Injectable()
export class UpdateUniversityUseCase {
  constructor(
    @Inject(UNIVERSITY_REPOSITORY)
    private readonly repo: IUniversityRepository,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    dto: UpdateUniversityDto,
  ): Promise<UniversityResponseDto> {
    const university = await this.repo.findById(id, tenantId);
    if (!university) {
      throw new NotFoundException(`University "${id}" not found`);
    }

    university.update({
      name: dto.name,
      country: dto.country,
      website: dto.website,
    });

    const updated = await this.repo.update(university);
    return UniversityResponseDto.fromDomain(updated);
  }
}
