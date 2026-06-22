import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { ISubjectCompetencyRepository } from '../../application/use-cases/competency.use-cases';
import { Competency } from '../../domain/entities/competency.entity';
import { CompetencyMapper } from '../mappers/competency.mapper';

@Injectable()
export class PrismaSubjectCompetencyRepository implements ISubjectCompetencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exists(subjectId: string, competencyId: string): Promise<boolean> {
    const row = await this.prisma.subjectCompetency.findUnique({
      where: { subjectId_competencyId: { subjectId, competencyId } },
    });
    return !!row;
  }

  async link(subjectId: string, competencyId: string): Promise<void> {
    await this.prisma.subjectCompetency.create({
      data: { subjectId, competencyId },
    });
  }

  async unlink(subjectId: string, competencyId: string): Promise<void> {
    await this.prisma.subjectCompetency.delete({
      where: { subjectId_competencyId: { subjectId, competencyId } },
    });
  }

  async findBySubject(subjectId: string): Promise<Competency[]> {
    const rows = await this.prisma.subjectCompetency.findMany({
      where: { subjectId },
      include: { competency: true },
    });
    return rows
      .filter((r) => !r.competency.deletedAt)
      .map((r) => CompetencyMapper.toDomain(r.competency));
  }
}
