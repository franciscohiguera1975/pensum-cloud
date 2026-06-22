import { Tenant } from '../../../../../../apps/backend/src/modules/tenant/domain/entities/tenant.entity';
import { TenantId } from '../../../../../../apps/backend/src/modules/tenant/domain/value-objects/tenant-id.value-object';
import { TenantSlug } from '../../../../../../apps/backend/src/modules/tenant/domain/value-objects/tenant-slug.value-object';

describe('Tenant entity', () => {
  describe('create', () => {
    it('should create a tenant with defaults', () => {
      const tenant = Tenant.create({ name: 'Demo U', slug: 'demo-u' });
      expect(tenant.name).toBe('Demo U');
      expect(tenant.slug.value).toBe('demo-u');
      expect(tenant.isActive).toBe(true);
      expect(tenant.id).toBeDefined();
    });

    it('should throw when name is empty', () => {
      expect(() => Tenant.create({ name: '   ', slug: 'ok-slug' })).toThrow(
        'Tenant name cannot be empty',
      );
    });

    it('should throw when name exceeds 255 chars', () => {
      expect(() =>
        Tenant.create({ name: 'a'.repeat(256), slug: 'ok-slug' }),
      ).toThrow('Tenant name must be at most 255 characters');
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', () => {
      const tenant = Tenant.create({ name: 'Demo U', slug: 'demo-u' });
      tenant.deactivate();
      expect(tenant.isActive).toBe(false);
    });

    it('should throw when already inactive', () => {
      const tenant = Tenant.create({ name: 'Demo U', slug: 'demo-u' });
      tenant.deactivate();
      expect(() => tenant.deactivate()).toThrow('Tenant is already inactive');
    });
  });

  describe('activate', () => {
    it('should set isActive to true', () => {
      const tenant = Tenant.reconstitute({
        id: TenantId.create(),
        name: 'Demo',
        slug: TenantSlug.fromString('demo'),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      tenant.activate();
      expect(tenant.isActive).toBe(true);
    });

    it('should throw when already active', () => {
      const tenant = Tenant.create({ name: 'Demo U', slug: 'demo-u' });
      expect(() => tenant.activate()).toThrow('Tenant is already active');
    });
  });
});
