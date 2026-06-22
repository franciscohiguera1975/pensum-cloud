import { University } from '../../../../../../apps/backend/src/modules/university/domain/entities/university.entity';

const make = (overrides: Partial<Parameters<typeof University.create>[0]> = {}) =>
  University.create({
    tenantId: 'tenant-uuid',
    name: 'Universidad Nacional',
    code: 'UNAL',
    ...overrides,
  });

describe('University entity', () => {
  describe('create', () => {
    it('should create with valid data', () => {
      const u = make();
      expect(u.name).toBe('Universidad Nacional');
      expect(u.code).toBe('UNAL');
      expect(u.tenantId).toBe('tenant-uuid');
    });

    it('should uppercase the code', () => {
      const u = make({ code: 'unal' });
      expect(u.code).toBe('UNAL');
    });

    it('should throw when name is empty', () => {
      expect(() => make({ name: '  ' })).toThrow('University name cannot be empty');
    });

    it('should throw when code is empty', () => {
      expect(() => make({ code: '' })).toThrow('University code cannot be empty');
    });

    it('should throw when code exceeds 20 chars', () => {
      expect(() => make({ code: 'A'.repeat(21) })).toThrow(
        'University code must be at most 20 characters',
      );
    });
  });

  describe('update', () => {
    it('should update name', () => {
      const u = make();
      u.update({ name: 'Nueva Universidad' });
      expect(u.name).toBe('Nueva Universidad');
    });

    it('should throw when updating with empty name', () => {
      const u = make();
      expect(() => u.update({ name: '' })).toThrow('University name cannot be empty');
    });

    it('should update country and website independently', () => {
      const u = make();
      u.update({ country: 'Colombia', website: 'https://uni.edu.co' });
      expect(u.country).toBe('Colombia');
      expect(u.website).toBe('https://uni.edu.co');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', () => {
      const u = make();
      expect(u.deletedAt).toBeUndefined();
      u.softDelete();
      expect(u.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw when already deleted', () => {
      const u = make();
      u.softDelete();
      expect(() => u.softDelete()).toThrow('University is already deleted');
    });
  });
});
