import { Prerequisite as PrismaPrerequisite } from '@prisma/client';
import { Prerequisite } from '../../domain/entities/prerequisite.entity';

export class PrerequisiteMapper {
  static toDomain(raw: PrismaPrerequisite): Prerequisite {
    return Prerequisite.reconstitute({
      subjectId: raw.subjectId,
      requiresId: raw.requiresId,
      tenantId: raw.tenantId,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(prerequisite: Prerequisite): Omit<PrismaPrerequisite, 'id'> {
    return {
      subjectId: prerequisite.subjectId,
      requiresId: prerequisite.requiresId,
      tenantId: prerequisite.tenantId,
      createdAt: prerequisite.createdAt,
    };
  }
}
