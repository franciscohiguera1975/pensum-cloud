import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { ILearningOutcomeRepository } from '../../domain/repositories/learning-outcome.repository.interface';
import { LearningOutcome } from '../../domain/entities/learning-outcome.entity';
import { LearningOutcomeMapper } from '../mappers/learning-outcome.mapper';

@Injectable()
export class PrismaLearningOutcomeRepository implements ILearningOutcomeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<LearningOutcome | null> {
    const raw = await this.prisma.learningOutcome.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? LearningOutcomeMapper.toDomain(raw) : null;
  }

  async findBySubject(subjectId: string, tenantId: string): Promise<LearningOutcome[]> {
    const rows = await this.prisma.learningOutcome.findMany({
      where: { subjectId, tenantId, deletedAt: null },
      orderBy: { code: 'asc' },
    });
    return rows.map(LearningOutcomeMapper.toDomain);
  }

  async findByCompetency(competencyId: string, tenantId: string): Promise<LearningOutcome[]> {
    const rows = await this.prisma.learningOutcome.findMany({
      where: { competencyId, tenantId, deletedAt: null },
      orderBy: { code: 'asc' },
    });
    return rows.map(LearningOutcomeMapper.toDomain);
  }

  async save(lo: LearningOutcome): Promise<void> {
    await this.prisma.learningOutcome.create({
      data: {
        id: lo.id,
        tenantId: lo.tenantId,
        description: lo.description,
        code: lo.code,
        subjectId: lo.subjectId,
        competencyId: lo.competencyId,
        createdAt: lo.createdAt,
        updatedAt: lo.updatedAt,
      },
    });
  }

  async update(lo: LearningOutcome): Promise<void> {
    await this.prisma.learningOutcome.update({
      where: { id: lo.id },
      data: {
        description: lo.description,
        code: lo.code,
        updatedAt: lo.updatedAt,
      },
    });
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.learningOutcome.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
