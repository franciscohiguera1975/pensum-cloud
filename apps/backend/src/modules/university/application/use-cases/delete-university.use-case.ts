import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUniversityRepository,
  UNIVERSITY_REPOSITORY,
} from '../../domain/repositories/university.repository.interface';

@Injectable()
export class DeleteUniversityUseCase {
  constructor(
    @Inject(UNIVERSITY_REPOSITORY)
    private readonly repo: IUniversityRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const university = await this.repo.findById(id, tenantId);
    if (!university) {
      throw new NotFoundException(`University "${id}" not found`);
    }

    university.softDelete();
    await this.repo.update(university);
  }
}
