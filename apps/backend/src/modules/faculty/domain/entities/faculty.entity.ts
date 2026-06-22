export interface FacultyProps {
  id: string;
  tenantId: string;
  universityId: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Faculty {
  private readonly props: FacultyProps;

  private constructor(props: FacultyProps) {
    this.props = props;
  }

  static create(params: {
    tenantId: string;
    universityId: string;
    name: string;
    code: string;
    id?: string;
  }): Faculty {
    const name = params.name.trim();
    const code = params.code.trim().toUpperCase();

    if (!name) throw new Error('Faculty name cannot be empty');
    if (name.length > 255) throw new Error('Faculty name must be at most 255 characters');
    if (!code) throw new Error('Faculty code cannot be empty');
    if (code.length > 20) throw new Error('Faculty code must be at most 20 characters');

    return new Faculty({
      id: params.id ?? crypto.randomUUID(),
      tenantId: params.tenantId,
      universityId: params.universityId,
      name,
      code,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: FacultyProps): Faculty {
    return new Faculty(props);
  }

  update(params: { name?: string }): void {
    if (params.name !== undefined) {
      const name = params.name.trim();
      if (!name) throw new Error('Faculty name cannot be empty');
      if (name.length > 255) throw new Error('Faculty name must be at most 255 characters');
      this.props.name = name;
    }
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt) throw new Error('Faculty is already deleted');
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get universityId(): string { return this.props.universityId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null | undefined { return this.props.deletedAt; }
}
