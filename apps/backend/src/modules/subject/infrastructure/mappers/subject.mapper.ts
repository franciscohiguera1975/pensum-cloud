import { Subject as PrismaSubject } from '@prisma/client';
import { Subject } from '../../domain/entities/subject.entity';

export class SubjectMapper {
  static toDomain(raw: PrismaSubject): Subject {
    return Subject.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      semesterId: raw.semesterId,
      name: raw.name,
      code: raw.code,
      credits: raw.credits,
      hoursTheory: raw.hoursTheory,
      hoursPractice: raw.hoursPractice,
      description: raw.description,
      position: raw.position,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(subject: Subject): Omit<PrismaSubject, 'createdAt' | 'updatedAt'> {
    return {
      id: subject.id,
      tenantId: subject.tenantId,
      semesterId: subject.semesterId,
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      hoursTheory: subject.hoursTheory,
      hoursPractice: subject.hoursPractice,
      description: subject.description,
      position: subject.position,
      deletedAt: subject.deletedAt,
    };
  }
}
