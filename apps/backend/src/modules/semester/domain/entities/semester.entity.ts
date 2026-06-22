export interface SemesterProps {
  id: string;
  tenantId: string;
  curriculumId: string;
  number: number;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateSemesterProps {
  tenantId: string;
  curriculumId: string;
  number: number;
  name?: string;
  id?: string;
}

export class Semester {
  private constructor(private props: SemesterProps) {}

  static create(p: CreateSemesterProps): Semester {
    const { randomUUID } = require('crypto');
    const now = new Date();
    return new Semester({
      id: p.id ?? randomUUID(),
      tenantId: p.tenantId,
      curriculumId: p.curriculumId,
      number: p.number,
      name: p.name?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: SemesterProps): Semester {
    return new Semester(props);
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get curriculumId(): string { return this.props.curriculumId; }
  get number(): number { return this.props.number; }
  get name(): string | null { return this.props.name; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt; }

  update(fields: { name?: string }): void {
    if (fields.name !== undefined) this.props.name = fields.name.trim();
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt !== null) {
      throw new Error('Semester is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }
}
