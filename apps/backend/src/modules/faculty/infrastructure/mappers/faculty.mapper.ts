import { Faculty as PrismaFaculty } from '@prisma/client';
import { Faculty } from '../../domain/entities/faculty.entity';

export class FacultyMapper {
  static toDomain(raw: PrismaFaculty): Faculty {
    return Faculty.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      universityId: raw.universityId,
      name: raw.name,
      code: raw.code,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(f: Faculty): PrismaFaculty {
    return {
      id: f.id,
      tenantId: f.tenantId,
      universityId: f.universityId,
      name: f.name,
      code: f.code,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      deletedAt: f.deletedAt ?? null,
    };
  }
}
