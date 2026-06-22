import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { Career } from '../../domain/entities/career.entity';
import { ICareerRepository } from '../../domain/repositories/career.repository.interface';
import { CareerMapper } from '../mappers/career.mapper';

@Injectable()
export class PrismaCareerRepository implements ICareerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Career | null> {
    const raw = await this.prisma.career.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? CareerMapper.toDomain(raw) : null;
  }

  async findAllByFaculty(facultyId: string, tenantId: string): Promise<Career[]> {
    const rows = await this.prisma.career.findMany({
      where: { facultyId, tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return rows.map(CareerMapper.toDomain);
  }

  async existsByCode(
    code: string,
    facultyId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.career.count({
      where: {
        code: code.toUpperCase(),
        facultyId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async save(career: Career): Promise<Career> {
    const data = CareerMapper.toPersistence(career);
    const raw = await this.prisma.career.create({ data });
    return CareerMapper.toDomain(raw);
  }

  async update(career: Career): Promise<Career> {
    const { id, ...data } = CareerMapper.toPersistence(career);
    const raw = await this.prisma.career.update({ where: { id }, data });
    return CareerMapper.toDomain(raw);
  }
}
