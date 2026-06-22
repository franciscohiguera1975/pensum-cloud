export interface SubjectProps {
  id: string;
  tenantId: string;
  semesterId: string;
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateSubjectProps {
  tenantId: string;
  semesterId: string;
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description?: string;
  position?: number;
  id?: string;
}

export class Subject {
  private constructor(private props: SubjectProps) {}

  static create(p: CreateSubjectProps): Subject {
    const { randomUUID } = require('crypto');
    const now = new Date();
    return new Subject({
      id: p.id ?? randomUUID(),
      tenantId: p.tenantId,
      semesterId: p.semesterId,
      name: p.name.trim(),
      code: p.code.trim().toUpperCase(),
      credits: p.credits,
      hoursTheory: p.hoursTheory,
      hoursPractice: p.hoursPractice,
      description: p.description?.trim() ?? null,
      position: p.position ?? 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: SubjectProps): Subject {
    return new Subject(props);
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get semesterId(): string { return this.props.semesterId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get credits(): number { return this.props.credits; }
  get hoursTheory(): number { return this.props.hoursTheory; }
  get hoursPractice(): number { return this.props.hoursPractice; }
  get description(): string | null { return this.props.description; }
  get position(): number { return this.props.position; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt; }

  update(fields: {
    name?: string;
    credits?: number;
    hoursTheory?: number;
    hoursPractice?: number;
    description?: string;
  }): void {
    if (fields.name !== undefined) this.props.name = fields.name.trim();
    if (fields.credits !== undefined) this.props.credits = fields.credits;
    if (fields.hoursTheory !== undefined) this.props.hoursTheory = fields.hoursTheory;
    if (fields.hoursPractice !== undefined) this.props.hoursPractice = fields.hoursPractice;
    if (fields.description !== undefined) this.props.description = fields.description.trim();
    this.props.updatedAt = new Date();
  }

  moveTo(semesterId: string, position?: number): void {
    this.props.semesterId = semesterId;
    if (position !== undefined) this.props.position = position;
    this.props.updatedAt = new Date();
  }

  setPosition(position: number): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt !== null) {
      throw new Error('Subject is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }
}
