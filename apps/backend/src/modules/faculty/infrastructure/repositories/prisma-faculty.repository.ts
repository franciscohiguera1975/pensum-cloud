import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { Faculty } from '../../domain/entities/faculty.entity';
import { IFacultyRepository } from '../../domain/repositories/faculty.repository.interface';
import { FacultyMapper } from '../mappers/faculty.mapper';

@Injectable()
export class PrismaFacultyRepository implements IFacultyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Faculty | null> {
    const raw = await this.prisma.faculty.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? FacultyMapper.toDomain(raw) : null;
  }

  async findAllByUniversity(
    universityId: string,
    tenantId: string,
  ): Promise<Faculty[]> {
    const rows = await this.prisma.faculty.findMany({
      where: { universityId, tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return rows.map(FacultyMapper.toDomain);
  }

  async existsByCode(
    code: string,
    universityId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.faculty.count({
      where: {
        code: code.toUpperCase(),
        universityId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async save(faculty: Faculty): Promise<Faculty> {
    const data = FacultyMapper.toPersistence(faculty);
    const raw = await this.prisma.faculty.create({ data });
    return FacultyMapper.toDomain(raw);
  }

  async update(faculty: Faculty): Promise<Faculty> {
    const { id, ...data } = FacultyMapper.toPersistence(faculty);
    const raw = await this.prisma.faculty.update({ where: { id }, data });
    return FacultyMapper.toDomain(raw);
  }
}
