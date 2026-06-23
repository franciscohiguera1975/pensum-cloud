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

  async execute(
    tenantId: string,
    user?: { userId: string; roles: string[] },
  ): Promise<UniversityResponseDto[]> {
    // ADMINs (and internal calls without a user context) see every university
    // in the tenant. Other users only see universities explicitly granted.
    const isAdmin = !user || user.roles.includes('ADMIN');
    const universities = isAdmin
      ? await this.repo.findAll(tenantId)
      : await this.repo.findAllForUser(tenantId, user.userId);
    return universities.map(UniversityResponseDto.fromDomain);
  }
}
