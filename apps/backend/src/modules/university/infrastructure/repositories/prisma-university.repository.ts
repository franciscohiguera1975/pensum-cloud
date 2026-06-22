import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { University } from '../../domain/entities/university.entity';
import { IUniversityRepository } from '../../domain/repositories/university.repository.interface';
import { UniversityMapper } from '../mappers/university.mapper';

@Injectable()
export class PrismaUniversityRepository implements IUniversityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<University | null> {
    const raw = await this.prisma.university.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? UniversityMapper.toDomain(raw) : null;
  }

  async findAll(tenantId: string): Promise<University[]> {
    const rows = await this.prisma.university.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return rows.map(UniversityMapper.toDomain);
  }

  async existsByCode(
    code: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.university.count({
      where: {
        code: code.toUpperCase(),
        tenantId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async save(university: University): Promise<University> {
    const data = UniversityMapper.toPersistence(university);
    const raw = await this.prisma.university.create({ data });
    return UniversityMapper.toDomain(raw);
  }

  async update(university: University): Promise<University> {
    const { id, ...data } = UniversityMapper.toPersistence(university);
    const raw = await this.prisma.university.update({
      where: { id },
      data,
    });
    return UniversityMapper.toDomain(raw);
  }
}
