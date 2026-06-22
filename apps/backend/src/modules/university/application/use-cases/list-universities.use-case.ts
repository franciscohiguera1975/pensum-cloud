import { Inject, Injectable } from '@nestjs/common';
import {
  IUniversityRepository,
  UNIVERSITY_REPOSITORY,
} from '../../domain/repositories/university.repository.interface';
import { UniversityResponseDto } from '../dto/university-response.dto';

@Injectable()
export class ListUniversitiesUseCase {
  constructor(
    @Inject(UNIVERSITY_REPOSITORY)
    private readonly repo: IUniversityRepository,
  ) {}

  async execute(tenantId: string): Promise<UniversityResponseDto[]> {
    const universities = await this.repo.findAll(tenantId);
    return universities.map(UniversityResponseDto.fromDomain);
  }
}
