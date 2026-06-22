import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ICurriculumAuditRepository,
  CURRICULUM_AUDIT_REPOSITORY,
  SubjectAuditNode,
} from '../../domain/repositories/curriculum-audit.repository.interface';
import {
  ICurriculumRepository,
  CURRICULUM_REPOSITORY,
} from '../../domain/repositories/curriculum.repository.interface';
import {
  CurriculumCompareResponseDto,
  CurriculumRedundanciesResponseDto,
  FieldChangeDto,
  RedundancyGroupDto,
  SubjectDiffDto,
  SubjectDiffStatus,
} from '../dto/curriculum-audit.dto';

// ── CompareCurriculaUseCase ────────────────────────────────────────────────────

@Injectable()
export class CompareCurriculaUseCase {
  constructor(
    @Inject(CURRICULUM_AUDIT_REPOSITORY)
    private readonly auditRepo: ICurriculumAuditRepository,
    @Inject(CURRICULUM_REPOSITORY)
    private readonly curriculumRepo: ICurriculumRepository,
  ) {}

  async execute(
    curriculumAId: string,
    curriculumBId: string,
    tenantId: string,
  ): Promise<CurriculumCompareResponseDto> {
    if (curriculumAId === curriculumBId) {
      throw new BadRequestException('Cannot compare a curriculum with itself');
    }

    const [curA, curB] = await Promise.all([
      this.curriculumRepo.findById(curriculumAId, tenantId),
      this.curriculumRepo.findById(curriculumBId, tenantId),
    ]);

    if (!curA) throw new NotFoundException(`Curriculum ${curriculumAId} not found`);
    if (!curB) throw new NotFoundException(`Curriculum ${curriculumBId} not found`);

    const [subjectsA, subjectsB] = await Promise.all([
      this.auditRepo.loadSubjectsWithCompetencies(curriculumAId, tenantId),
      this.auditRepo.loadSubjectsWithCompetencies(curriculumBId, tenantId),
    ]);

    const mapA = new Map(subjectsA.map((s) => [s.code, s]));
    const mapB = new Map(subjectsB.map((s) => [s.code, s]));

    const diffs: SubjectDiffDto[] = [];

    for (const [code, sA] of mapA) {
      const sB = mapB.get(code);
      if (!sB) {
        diffs.push({ code, name: sA.name, credits: sA.credits, semesterNumber: sA.semesterNumber, status: 'REMOVED' });
      } else {
        const changes = this.detectChanges(sA, sB);
        const status: SubjectDiffStatus = changes.length > 0 ? 'MODIFIED' : 'UNCHANGED';
        diffs.push({
          code,
          name: sB.name,
          credits: sB.credits,
          semesterNumber: sB.semesterNumber,
          status,
          ...(changes.length > 0 && { changes }),
        });
      }
    }

    for (const [code, sB] of mapB) {
      if (!mapA.has(code)) {
        diffs.push({ code, name: sB.name, credits: sB.credits, semesterNumber: sB.semesterNumber, status: 'ADDED' });
      }
    }

    diffs.sort((a, b) => a.semesterNumber - b.semesterNumber || a.code.localeCompare(b.code));

    return {
      curriculumAId,
      curriculumBId,
      addedCount: diffs.filter((d) => d.status === 'ADDED').length,
      removedCount: diffs.filter((d) => d.status === 'REMOVED').length,
      modifiedCount: diffs.filter((d) => d.status === 'MODIFIED').length,
      unchangedCount: diffs.filter((d) => d.status === 'UNCHANGED').length,
      subjects: diffs,
    };
  }

  private detectChanges(a: SubjectAuditNode, b: SubjectAuditNode): FieldChangeDto[] {
    const changes: FieldChangeDto[] = [];
    if (a.name !== b.name) changes.push({ field: 'name', from: a.name, to: b.name });
    if (a.credits !== b.credits) changes.push({ field: 'credits', from: a.credits, to: b.credits });
    if (a.semesterNumber !== b.semesterNumber) {
      changes.push({ field: 'semesterNumber', from: a.semesterNumber, to: b.semesterNumber });
    }
    return changes;
  }
}

// ── FindRedundanciesUseCase ───────────────────────────────────────────────────

@Injectable()
export class FindRedundanciesUseCase {
  constructor(
    @Inject(CURRICULUM_AUDIT_REPOSITORY)
    private readonly auditRepo: ICurriculumAuditRepository,
    @Inject(CURRICULUM_REPOSITORY)
    private readonly curriculumRepo: ICurriculumRepository,
  ) {}

  async execute(curriculumId: string, tenantId: string): Promise<CurriculumRedundanciesResponseDto> {
    const curriculum = await this.curriculumRepo.findById(curriculumId, tenantId);
    if (!curriculum) throw new NotFoundException(`Curriculum ${curriculumId} not found`);

    const subjects = await this.auditRepo.loadSubjectsWithCompetencies(curriculumId, tenantId);

    const groups = this.groupByCompetencies(subjects);

    return {
      curriculumId,
      totalRedundancyGroups: groups.length,
      groups,
    };
  }

  private groupByCompetencies(subjects: SubjectAuditNode[]): RedundancyGroupDto[] {
    const withCompetencies = subjects.filter((s) => s.competencyIds.length > 0);

    // Build key = sorted competency IDs joined
    const buckets = new Map<string, SubjectAuditNode[]>();
    for (const subject of withCompetencies) {
      const key = [...subject.competencyIds].sort().join(',');
      const bucket = buckets.get(key) ?? [];
      bucket.push(subject);
      buckets.set(key, bucket);
    }

    const groups: RedundancyGroupDto[] = [];
    for (const [key, members] of buckets) {
      if (members.length > 1) {
        groups.push({
          reason: 'SAME_COMPETENCIES',
          subjectIds: members.map((s) => s.id),
          subjectCodes: members.map((s) => s.code),
          competencyIds: key.split(','),
        });
      }
    }

    return groups;
  }
}

export const CURRICULUM_AUDIT_USE_CASES = [CompareCurriculaUseCase, FindRedundanciesUseCase];
