import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { Prerequisite } from '../../domain/entities/prerequisite.entity';
import { IPrerequisiteRepository } from '../../domain/repositories/prerequisite.repository.interface';
import { PrerequisiteMapper } from '../mappers/prerequisite.mapper';

@Injectable()
export class PrismaPrerequisiteRepository implements IPrerequisiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySubject(subjectId: string, tenantId: string): Promise<Prerequisite[]> {
    const rows = await this.prisma.prerequisite.findMany({
      where: { subjectId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(PrerequisiteMapper.toDomain);
  }

  async exists(subjectId: string, requiresId: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.prerequisite.count({
      where: { subjectId, requiresId, tenantId },
    });
    return count > 0;
  }

  async save(prerequisite: Prerequisite): Promise<Prerequisite> {
    const data = PrerequisiteMapper.toPersistence(prerequisite);
    const raw = await this.prisma.prerequisite.create({ data });
    return PrerequisiteMapper.toDomain(raw);
  }

  async delete(subjectId: string, requiresId: string, tenantId: string): Promise<void> {
    await this.prisma.prerequisite.delete({
      where: { subjectId_requiresId: { subjectId, requiresId } },
    });
  }
}
