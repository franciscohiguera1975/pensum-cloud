import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUniversityRepository,
  UNIVERSITY_REPOSITORY,
} from '../../domain/repositories/university.repository.interface';
import { UniversityResponseDto } from '../dto/university-response.dto';

@Injectable()
export class GetUniversityUseCase {
  constructor(
    @Inject(UNIVERSITY_REPOSITORY)
    private readonly repo: IUniversityRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<UniversityResponseDto> {
    const university = await this.repo.findById(id, tenantId);
    if (!university) {
      throw new NotFoundException(`University "${id}" not found`);
    }
    return UniversityResponseDto.fromDomain(university);
  }
}
