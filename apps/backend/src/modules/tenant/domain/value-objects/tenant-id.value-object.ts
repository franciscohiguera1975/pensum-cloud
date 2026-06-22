import { randomUUID } from 'crypto';

export class TenantId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value?: string): TenantId {
    return new TenantId(value ?? randomUUID());
  }

  static fromString(value: string): TenantId {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId cannot be empty');
    }
    return new TenantId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: TenantId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
