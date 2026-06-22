import { Curriculum as PrismaCurriculum } from '@prisma/client';
import { Curriculum, CurriculumStatus } from '../../domain/entities/curriculum.entity';

export class CurriculumMapper {
  static toDomain(raw: PrismaCurriculum): Curriculum {
    return Curriculum.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      careerId: raw.careerId,
      version: raw.version,
      name: raw.name,
      description: raw.description,
      status: raw.status as CurriculumStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(curriculum: Curriculum): Omit<PrismaCurriculum, 'createdAt' | 'updatedAt'> {
    return {
      id: curriculum.id,
      tenantId: curriculum.tenantId,
      careerId: curriculum.careerId,
      version: curriculum.version,
      name: curriculum.name,
      description: curriculum.description,
      status: curriculum.status,
      deletedAt: curriculum.deletedAt,
    };
  }
}
