import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  ICurriculumPathRepository,
  CURRICULUM_PATH_REPOSITORY,
  SubjectNode,
} from '../../domain/repositories/curriculum-path.repository.interface';
import {
  ICurriculumRepository,
  CURRICULUM_REPOSITORY,
} from '../../domain/repositories/curriculum.repository.interface';
import {
  CurriculumPathResponseDto,
  SubjectPathDto,
} from '../dto/curriculum-path.dto';

@Injectable()
export class GetCurriculumPathUseCase {
  constructor(
    @Inject(CURRICULUM_PATH_REPOSITORY)
    private readonly pathRepo: ICurriculumPathRepository,
    @Inject(CURRICULUM_REPOSITORY)
    private readonly curriculumRepo: ICurriculumRepository,
  ) {}

  async execute(
    curriculumId: string,
    tenantId: string,
    completedIds: string[],
  ): Promise<CurriculumPathResponseDto> {
    const curriculum = await this.curriculumRepo.findById(curriculumId, tenantId);
    if (!curriculum) throw new NotFoundException(`Curriculum ${curriculumId} not found`);

    const subjects = await this.pathRepo.loadSubjectGraph(curriculumId, tenantId);
    const completedSet = new Set(completedIds);

    const result: SubjectPathDto[] = subjects.map((s) => this.classify(s, completedSet));

    return {
      curriculumId,
      totalSubjects: result.length,
      completedCount: result.filter((s) => s.status === 'COMPLETED').length,
      availableCount: result.filter((s) => s.status === 'AVAILABLE').length,
      lockedCount: result.filter((s) => s.status === 'LOCKED').length,
      subjects: result.sort((a, b) => a.semesterNumber - b.semesterNumber),
    };
  }

  private classify(subject: SubjectNode, completedSet: Set<string>): SubjectPathDto {
    if (completedSet.has(subject.id)) {
      return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        semesterNumber: subject.semesterNumber,
        status: 'COMPLETED',
      };
    }

    const missing = subject.prerequisiteIds.filter((prereqId) => !completedSet.has(prereqId));

    if (missing.length === 0) {
      return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        semesterNumber: subject.semesterNumber,
        status: 'AVAILABLE',
      };
    }

    return {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      semesterNumber: subject.semesterNumber,
      status: 'LOCKED',
      missingPrerequisites: missing,
    };
  }
}
