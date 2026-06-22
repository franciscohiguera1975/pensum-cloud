export interface LearningOutcomeProps {
  id: string;
  tenantId: string;
  description: string;
  code?: string | null;
  subjectId?: string | null;
  competencyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class LearningOutcome {
  readonly id: string;
  readonly tenantId: string;
  description: string;
  code: string | null;
  readonly subjectId: string | null;
  readonly competencyId: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  private constructor(props: LearningOutcomeProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.description = props.description;
    this.code = props.code ?? null;
    this.subjectId = props.subjectId ?? null;
    this.competencyId = props.competencyId ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(params: {
    id: string;
    tenantId: string;
    description: string;
    code?: string;
    subjectId?: string;
    competencyId?: string;
  }): LearningOutcome {
    const now = new Date();
    return new LearningOutcome({
      ...params,
      code: params.code?.toUpperCase() ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: LearningOutcomeProps): LearningOutcome {
    return new LearningOutcome(props);
  }

  update(params: { description?: string; code?: string }): void {
    if (params.description !== undefined) this.description = params.description;
    if (params.code !== undefined) this.code = params.code.toUpperCase();
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }
}
