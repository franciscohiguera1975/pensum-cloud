import { University as PrismaUniversity } from '@prisma/client';
import { University } from '../../domain/entities/university.entity';

export class UniversityMapper {
  static toDomain(raw: PrismaUniversity): University {
    return University.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      name: raw.name,
      code: raw.code,
      country: raw.country,
      website: raw.website,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(
    u: University,
  ): Omit<PrismaUniversity, 'createdAt' | 'updatedAt'> & {
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: u.id,
      tenantId: u.tenantId,
      name: u.name,
      code: u.code,
      country: u.country,
      website: u.website,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      deletedAt: u.deletedAt ?? null,
    };
  }
}
