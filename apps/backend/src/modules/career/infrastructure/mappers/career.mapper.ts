import { Career as PrismaCareer } from '@prisma/client';
import { Career } from '../../domain/entities/career.entity';

export class CareerMapper {
  static toDomain(raw: PrismaCareer): Career {
    return Career.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      facultyId: raw.facultyId,
      name: raw.name,
      code: raw.code,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(c: Career): PrismaCareer {
    return {
      id: c.id,
      tenantId: c.tenantId,
      facultyId: c.facultyId,
      name: c.name,
      code: c.code,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      deletedAt: c.deletedAt ?? null,
    };
  }
}
