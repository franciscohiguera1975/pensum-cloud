import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  ICurriculumPathRepository,
  SubjectNode,
} from '../../domain/repositories/curriculum-path.repository.interface';

@Injectable()
export class PrismaCurriculumPathRepository implements ICurriculumPathRepository {
  constructor(private readonly prisma: PrismaService) {}

  async loadSubjectGraph(curriculumId: string, tenantId: string): Promise<SubjectNode[]> {
    const semesters = await this.prisma.semester.findMany({
      where: { curriculumId, tenantId, deletedAt: null },
      include: {
        subjects: {
          where: { deletedAt: null },
          include: {
            prerequisites: {
              include: { requires: { select: { id: true } } },
            },
          },
        },
      },
      orderBy: { number: 'asc' },
    });

    const nodes: SubjectNode[] = [];
    for (const semester of semesters) {
      for (const subject of semester.subjects) {
        nodes.push({
          id: subject.id,
          code: subject.code,
          name: subject.name,
          credits: subject.credits,
          semesterNumber: semester.number,
          prerequisiteIds: subject.prerequisites.map((p) => p.requiresId),
        });
      }
    }
    return nodes;
  }
}
