import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { Subject } from '../../domain/entities/subject.entity';
import { ISubjectRepository } from '../../domain/repositories/subject.repository.interface';
import { SubjectMapper } from '../mappers/subject.mapper';

@Injectable()
export class PrismaSubjectRepository implements ISubjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Subject | null> {
    const raw = await this.prisma.subject.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? SubjectMapper.toDomain(raw) : null;
  }

  async findAllBySemester(semesterId: string, tenantId: string): Promise<Subject[]> {
    const rows = await this.prisma.subject.findMany({
      where: { semesterId, tenantId, deletedAt: null },
      orderBy: [{ position: 'asc' }, { code: 'asc' }],
    });
    return rows.map(SubjectMapper.toDomain);
  }

  async existsByCode(semesterId: string, code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.subject.count({
      where: {
        semesterId,
        code: code.toUpperCase(),
        tenantId,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async save(subject: Subject): Promise<Subject> {
    const data = SubjectMapper.toPersistence(subject);
    const raw = await this.prisma.subject.create({ data });
    return SubjectMapper.toDomain(raw);
  }

  async update(subject: Subject): Promise<Subject> {
    const data = SubjectMapper.toPersistence(subject);
    const raw = await this.prisma.subject.update({
      where: { id: subject.id },
      data,
    });
    return SubjectMapper.toDomain(raw);
  }

  async reorderInSemester(tenantId: string, semesterId: string, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.subject.update({
          where: { id, tenantId },
          data: { position: index },
        }),
      ),
    );
  }
}
