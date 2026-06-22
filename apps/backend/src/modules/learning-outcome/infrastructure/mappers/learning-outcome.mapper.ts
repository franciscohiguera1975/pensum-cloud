import { LearningOutcome } from '../../domain/entities/learning-outcome.entity';
import { LearningOutcomeResponseDto } from '../../application/dto/learning-outcome.dto';

export class LearningOutcomeMapper {
  static toResponse(lo: LearningOutcome): LearningOutcomeResponseDto {
    return {
      id: lo.id,
      tenantId: lo.tenantId,
      description: lo.description,
      code: lo.code,
      subjectId: lo.subjectId,
      competencyId: lo.competencyId,
      createdAt: lo.createdAt,
      updatedAt: lo.updatedAt,
    };
  }

  static toDomain(raw: {
    id: string;
    tenantId: string;
    description: string;
    code: string | null;
    subjectId: string | null;
    competencyId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): LearningOutcome {
    return LearningOutcome.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      description: raw.description,
      code: raw.code,
      subjectId: raw.subjectId,
      competencyId: raw.competencyId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
