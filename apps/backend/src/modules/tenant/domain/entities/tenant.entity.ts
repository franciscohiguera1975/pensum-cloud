import { TenantId } from '../value-objects/tenant-id.value-object';
import { TenantSlug } from '../value-objects/tenant-slug.value-object';

export interface TenantProps {
  id: TenantId;
  name: string;
  slug: TenantSlug;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class Tenant {
  private readonly props: TenantProps;

  private constructor(props: TenantProps) {
    this.props = props;
  }

  static create(params: {
    name: string;
    slug: string;
    id?: string;
  }): Tenant {
    const name = params.name.trim();
    if (name.length === 0) {
      throw new Error('Tenant name cannot be empty');
    }
    if (name.length > 255) {
      throw new Error('Tenant name must be at most 255 characters');
    }

    return new Tenant({
      id: TenantId.create(params.id),
      name,
      slug: TenantSlug.create(params.slug),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  deactivate(): void {
    if (!this.props.isActive) {
      throw new Error('Tenant is already inactive');
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.isActive) {
      throw new Error('Tenant is already active');
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  get id(): TenantId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): TenantSlug {
    return this.props.slug;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }
}
