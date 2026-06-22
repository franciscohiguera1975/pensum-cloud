import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { ICompetencyRepository } from '../../domain/repositories/competency.repository.interface';
import { Competency } from '../../domain/entities/competency.entity';
import { CompetencyMapper } from '../mappers/competency.mapper';

@Injectable()
export class PrismaCompetencyRepository implements ICompetencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Competency | null> {
    const raw = await this.prisma.competency.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? CompetencyMapper.toDomain(raw) : null;
  }

  async findAll(tenantId: string): Promise<Competency[]> {
    const rows = await this.prisma.competency.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return rows.map(CompetencyMapper.toDomain);
  }

  async existsByCode(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const upper = code.toUpperCase();
    const row = await this.prisma.competency.findFirst({
      where: {
        tenantId,
        code: upper,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return !!row;
  }

  async save(competency: Competency): Promise<void> {
    await this.prisma.competency.create({
      data: {
        id: competency.id,
        tenantId: competency.tenantId,
        name: competency.name,
        code: competency.code,
        description: competency.description,
        createdAt: competency.createdAt,
        updatedAt: competency.updatedAt,
      },
    });
  }

  async update(competency: Competency): Promise<void> {
    await this.prisma.competency.update({
      where: { id: competency.id },
      data: {
        name: competency.name,
        code: competency.code,
        description: competency.description,
        updatedAt: competency.updatedAt,
      },
    });
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.competency.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
