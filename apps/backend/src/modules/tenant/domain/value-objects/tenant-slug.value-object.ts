export class TenantSlug {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): TenantSlug {
    const slug = raw
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (slug.length === 0) {
      throw new Error('TenantSlug cannot be empty after normalization');
    }
    if (slug.length < 3) {
      throw new Error('TenantSlug must be at least 3 characters');
    }
    if (slug.length > 63) {
      throw new Error('TenantSlug must be at most 63 characters');
    }

    return new TenantSlug(slug);
  }

  static fromString(value: string): TenantSlug {
    return new TenantSlug(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: TenantSlug): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
