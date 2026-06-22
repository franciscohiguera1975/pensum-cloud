import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import {
  ICurriculumAuditRepository,
  SubjectAuditNode,
} from '../../domain/repositories/curriculum-audit.repository.interface';

@Injectable()
export class PrismaCurriculumAuditRepository implements ICurriculumAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async loadSubjectsWithCompetencies(curriculumId: string, tenantId: string): Promise<SubjectAuditNode[]> {
    const semesters = await this.prisma.semester.findMany({
      where: { curriculumId, curriculum: { tenantId }, deletedAt: null },
      include: {
        subjects: {
          where: { deletedAt: null },
          include: {
            competencies: {
              select: { competencyId: true },
            },
          },
        },
      },
    });

    const nodes: SubjectAuditNode[] = [];
    for (const semester of semesters) {
      for (const subject of semester.subjects) {
        nodes.push({
          id: subject.id,
          code: subject.code,
          name: subject.name,
          credits: subject.credits,
          semesterNumber: semester.number,
          competencyIds: subject.competencies.map((c) => c.competencyId),
        });
      }
    }
    return nodes;
  }
}
