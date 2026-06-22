import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { Curriculum } from '../../domain/entities/curriculum.entity';
import { ICurriculumRepository } from '../../domain/repositories/curriculum.repository.interface';
import { CurriculumMapper } from '../mappers/curriculum.mapper';

@Injectable()
export class PrismaCurriculumRepository implements ICurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Curriculum | null> {
    const raw = await this.prisma.curriculum.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? CurriculumMapper.toDomain(raw) : null;
  }

  async findAllByCareer(careerId: string, tenantId: string): Promise<Curriculum[]> {
    const rows = await this.prisma.curriculum.findMany({
      where: { careerId, tenantId, deletedAt: null },
      orderBy: { version: 'asc' },
    });
    return rows.map(CurriculumMapper.toDomain);
  }

  async existsByVersion(careerId: string, version: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.curriculum.count({
      where: { careerId, version, tenantId, deletedAt: null },
    });
    return count > 0;
  }

  async save(curriculum: Curriculum): Promise<Curriculum> {
    const data = CurriculumMapper.toPersistence(curriculum);
    const raw = await this.prisma.curriculum.create({ data });
    return CurriculumMapper.toDomain(raw);
  }

  async update(curriculum: Curriculum): Promise<Curriculum> {
    const data = CurriculumMapper.toPersistence(curriculum);
    const raw = await this.prisma.curriculum.update({
      where: { id: curriculum.id },
      data,
    });
    return CurriculumMapper.toDomain(raw);
  }
}
