import { BcryptPasswordService } from '../../../../../../apps/backend/src/modules/auth/infrastructure/services/bcrypt-password.service';

describe('BcryptPasswordService', () => {
  let service: BcryptPasswordService;

  beforeEach(() => {
    service = new BcryptPasswordService();
  });

  it('should hash a password', async () => {
    const hashed = await service.hash('my-plain-password');
    expect(hashed).not.toBe('my-plain-password');
    expect(hashed.startsWith('$2')).toBe(true);
  });

  it('should return true for correct password', async () => {
    const hashed = await service.hash('correct-pass');
    const result = await service.compare('correct-pass', hashed);
    expect(result).toBe(true);
  });

  it('should return false for wrong password', async () => {
    const hashed = await service.hash('correct-pass');
    const result = await service.compare('wrong-pass', hashed);
    expect(result).toBe(false);
  });
});
