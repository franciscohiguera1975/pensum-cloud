export interface UserProps {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  universityIds: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = { ...props };
  }

  static create(params: {
    id: string;
    tenantId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): User {
    const now = new Date();
    return new User({
      ...params,
      isActive: true,
      roles: [],
      universityIds: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  update(params: { firstName?: string; lastName?: string }): void {
    if (params.firstName !== undefined) this.props.firstName = params.firstName;
    if (params.lastName !== undefined) this.props.lastName = params.lastName;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
  }

  get id(): string { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get email(): string { return this.props.email; }
  get password(): string { return this.props.password; }
  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get fullName(): string { return `${this.props.firstName} ${this.props.lastName}`; }
  get isActive(): boolean { return this.props.isActive; }
  get roles(): string[] { return this.props.roles; }
  get universityIds(): string[] { return this.props.universityIds; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | null { return this.props.deletedAt ?? null; }
}
