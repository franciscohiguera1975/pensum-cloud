import { Semester as PrismaSemester } from '@prisma/client';
import { Semester } from '../../domain/entities/semester.entity';

export class SemesterMapper {
  static toDomain(raw: PrismaSemester): Semester {
    return Semester.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      curriculumId: raw.curriculumId,
      number: raw.number,
      name: raw.name,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(semester: Semester): Omit<PrismaSemester, 'createdAt' | 'updatedAt'> {
    return {
      id: semester.id,
      tenantId: semester.tenantId,
      curriculumId: semester.curriculumId,
      number: semester.number,
      name: semester.name,
      deletedAt: semester.deletedAt,
    };
  }
}
