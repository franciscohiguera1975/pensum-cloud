export interface CareerProps {
  id: string;
  tenantId: string;
  facultyId: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Career {
  private readonly props: CareerProps;

  private constructor(props: CareerProps) {
    this.props = props;
  }

  static create(params: {
    tenantId: string;
    facultyId: string;
    name: string;
    code: string;
    description?: string | null;
    id?: string;
  }): Career {
    const name = params.name.trim();
    const code = params.code.trim().toUpperCase();

    if (!name) throw new Error('Career name cannot be empty');
    if (name.length > 255) throw new Error('Career name must be at most 255 characters');
    if (!code) throw new Error('Career code cannot be empty');
    if (code.length > 20) throw new Error('Career code must be at most 20 characters');

    return new Career({
      id: params.id ?? crypto.randomUUID(),
      tenantId: params.tenantId,
      facultyId: params.facultyId,
      name,
      code,
      description: params.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: CareerProps): Career {
    return new Career(props);
  }

  update(params: { name?: string; description?: string | null }): void {
    if (params.name !== undefined) {
      const name = params.name.trim();
      if (!name) throw new Error('Career name cannot be empty');
      if (name.length > 255) throw new Error('Career name must be at most 255 characters');
      this.props.name = name;
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt) throw new Error('Career is already deleted');
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get facultyId(): string { return this.props.facultyId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get description(): string | null { return this.props.description; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null | undefined { return this.props.deletedAt; }
}
