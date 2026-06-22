export interface UniversityProps {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  country: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class University {
  private readonly props: UniversityProps;

  private constructor(props: UniversityProps) {
    this.props = props;
  }

  static create(params: {
    tenantId: string;
    name: string;
    code: string;
    country?: string | null;
    website?: string | null;
    id?: string;
  }): University {
    const name = params.name.trim();
    const code = params.code.trim().toUpperCase();

    if (!name) throw new Error('University name cannot be empty');
    if (name.length > 255) throw new Error('University name must be at most 255 characters');
    if (!code) throw new Error('University code cannot be empty');
    if (code.length > 20) throw new Error('University code must be at most 20 characters');

    return new University({
      id: params.id ?? crypto.randomUUID(),
      tenantId: params.tenantId,
      name,
      code,
      country: params.country ?? null,
      website: params.website ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: UniversityProps): University {
    return new University(props);
  }

  update(params: {
    name?: string;
    country?: string | null;
    website?: string | null;
  }): void {
    if (params.name !== undefined) {
      const name = params.name.trim();
      if (!name) throw new Error('University name cannot be empty');
      if (name.length > 255) throw new Error('University name must be at most 255 characters');
      this.props.name = name;
    }
    if (params.country !== undefined) this.props.country = params.country;
    if (params.website !== undefined) this.props.website = params.website;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.deletedAt) throw new Error('University is already deleted');
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get country(): string | null { return this.props.country; }
  get website(): string | null { return this.props.website; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null | undefined { return this.props.deletedAt; }
}
