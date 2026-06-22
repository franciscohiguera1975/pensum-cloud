import { TenantSlug } from '../../../../../../apps/backend/src/modules/tenant/domain/value-objects/tenant-slug.value-object';

describe('TenantSlug', () => {
  it('should create a valid slug', () => {
    const slug = TenantSlug.create('Universidad Nacional');
    expect(slug.value).toBe('universidad-nacional');
  });

  it('should lowercase and trim the input', () => {
    expect(TenantSlug.create('  My University  ').value).toBe('my-university');
  });

  it('should remove special characters', () => {
    expect(TenantSlug.create('Uni & Tec!').value).toBe('uni--tec');
  });

  it('should collapse multiple dashes', () => {
    expect(TenantSlug.create('uni---nacional').value).toBe('uni-nacional');
  });

  it('should throw when slug is too short', () => {
    expect(() => TenantSlug.create('ab')).toThrow(
      'TenantSlug must be at least 3 characters',
    );
  });

  it('should throw when slug is too long', () => {
    expect(() => TenantSlug.create('a'.repeat(64))).toThrow(
      'TenantSlug must be at most 63 characters',
    );
  });

  it('should throw when slug normalizes to empty', () => {
    expect(() => TenantSlug.create('!!! ---')).toThrow(
      'TenantSlug cannot be empty after normalization',
    );
  });

  it('should compare equality', () => {
    const a = TenantSlug.create('my-uni');
    const b = TenantSlug.create('my-uni');
    expect(a.equals(b)).toBe(true);
  });
});
