export interface CompetencyProps {
  id: string;
  tenantId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Competency {
  readonly id: string;
  readonly tenantId: string;
  name: string;
  code: string | null;
  description: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  private constructor(props: CompetencyProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.code = props.code ?? null;
    this.description = props.description ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(params: {
    id: string;
    tenantId: string;
    name: string;
    code?: string;
    description?: string;
  }): Competency {
    const now = new Date();
    return new Competency({
      ...params,
      code: params.code?.toUpperCase() ?? null,
      description: params.description ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: CompetencyProps): Competency {
    return new Competency(props);
  }

  update(params: { name?: string; code?: string; description?: string }): void {
    if (params.name !== undefined) this.name = params.name;
    if (params.code !== undefined) this.code = params.code.toUpperCase();
    if (params.description !== undefined) this.description = params.description;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }
}
