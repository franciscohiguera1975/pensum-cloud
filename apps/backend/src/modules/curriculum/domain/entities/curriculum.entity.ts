export enum CurriculumStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface CurriculumProps {
  id: string;
  tenantId: string;
  careerId: string;
  version: string;
  name: string;
  description: string | null;
  status: CurriculumStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateCurriculumProps {
  tenantId: string;
  careerId: string;
  version: string;
  name: string;
  description?: string;
  id?: string;
}

export class Curriculum {
  private constructor(private props: CurriculumProps) {}

  static create(p: CreateCurriculumProps): Curriculum {
    const { randomUUID } = require('crypto');
    const now = new Date();
    return new Curriculum({
      id: p.id ?? randomUUID(),
      tenantId: p.tenantId,
      careerId: p.careerId,
      version: p.version,
      name: p.name.trim(),
      description: p.description?.trim() ?? null,
      status: CurriculumStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: CurriculumProps): Curriculum {
    return new Curriculum(props);
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get careerId(): string { return this.props.careerId; }
  get version(): string { return this.props.version; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get status(): CurriculumStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt; }

  update(fields: { name?: string; description?: string }): void {
    if (fields.name !== undefined) this.props.name = fields.name.trim();
    if (fields.description !== undefined) this.props.description = fields.description.trim();
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status === CurriculumStatus.ARCHIVED) {
      throw new Error('Cannot activate an archived curriculum');
    }
    this.props.status = CurriculumStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  archive(): void {
    if (this.props.status === CurriculumStatus.ARCHIVED) {
      throw new Error('Curriculum is already archived');
    }
    this.props.status = CurriculumStatus.ARCHIVED;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt !== null) {
      throw new Error('Curriculum is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }
}
