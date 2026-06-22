import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { Semester } from '../../domain/entities/semester.entity';
import { ISemesterRepository } from '../../domain/repositories/semester.repository.interface';
import { SemesterMapper } from '../mappers/semester.mapper';

@Injectable()
export class PrismaSemesterRepository implements ISemesterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Semester | null> {
    const raw = await this.prisma.semester.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? SemesterMapper.toDomain(raw) : null;
  }

  async findAllByCurriculum(curriculumId: string, tenantId: string): Promise<Semester[]> {
    const rows = await this.prisma.semester.findMany({
      where: { curriculumId, tenantId, deletedAt: null },
      orderBy: { number: 'asc' },
    });
    return rows.map(SemesterMapper.toDomain);
  }

  async existsByNumber(curriculumId: string, number: number, tenantId: string): Promise<boolean> {
    const count = await this.prisma.semester.count({
      where: { curriculumId, number, tenantId, deletedAt: null },
    });
    return count > 0;
  }

  async save(semester: Semester): Promise<Semester> {
    const data = SemesterMapper.toPersistence(semester);
    const raw = await this.prisma.semester.create({ data });
    return SemesterMapper.toDomain(raw);
  }

  async update(semester: Semester): Promise<Semester> {
    const data = SemesterMapper.toPersistence(semester);
    const raw = await this.prisma.semester.update({
      where: { id: semester.id },
      data,
    });
    return SemesterMapper.toDomain(raw);
  }
}
