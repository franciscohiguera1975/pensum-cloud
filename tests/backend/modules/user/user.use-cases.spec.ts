import { ConflictException, NotFoundException } from '@nestjs/common';
import { User } from '../../../../apps/backend/src/modules/user/domain/entities/user.entity';
import {
  CreateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
  DeactivateUserUseCase,
  DeleteUserUseCase,
} from '../../../../apps/backend/src/modules/user/application/use-cases/user.use-cases';

// ── Helpers ───────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1';

function makeUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}) {
  return User.create({
    id: 'user-1',
    tenantId,
    email: 'john@example.com',
    password: 'hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    ...overrides,
  });
}

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    existsByEmail: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

// ── User entity ───────────────────────────────────────────────────────────────

describe('User entity', () => {
  it('creates with isActive=true and empty roles', () => {
    const user = makeUser();
    expect(user.isActive).toBe(true);
    expect(user.roles).toEqual([]);
  });

  it('deactivate() sets isActive to false', () => {
    const user = makeUser();
    user.deactivate();
    expect(user.isActive).toBe(false);
  });

  it('update() changes firstName and lastName', () => {
    const user = makeUser();
    user.update({ firstName: 'Jane', lastName: 'Smith' });
    expect(user.firstName).toBe('Jane');
    expect(user.lastName).toBe('Smith');
    expect(user.fullName).toBe('Jane Smith');
  });

  it('softDelete() sets deletedAt', () => {
    const user = makeUser();
    user.softDelete();
    expect(user.deletedAt).not.toBeNull();
  });
});

// ── CreateUserUseCase ─────────────────────────────────────────────────────────

describe('CreateUserUseCase', () => {
  it('creates and saves user with hashed password', async () => {
    const repo = makeRepo({
      existsByEmail: jest.fn().mockResolvedValue(false),
      save: jest.fn(),
    });
    const uc = new CreateUserUseCase(repo as any);
    const result = await uc.execute(
      { email: 'a@b.com', password: 'password123', firstName: 'A', lastName: 'B' },
      tenantId,
    );
    expect(result.email).toBe('a@b.com');
    expect(repo.save).toHaveBeenCalled();
    // password should be hashed (not plaintext)
    const savedUser: User = repo.save.mock.calls[0][0];
    expect(savedUser.password).not.toBe('password123');
  });

  it('throws ConflictException when email exists', async () => {
    const repo = makeRepo({ existsByEmail: jest.fn().mockResolvedValue(true) });
    await expect(
      new CreateUserUseCase(repo as any).execute(
        { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B' },
        tenantId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

// ── GetUserUseCase ────────────────────────────────────────────────────────────

describe('GetUserUseCase', () => {
  it('returns the user', async () => {
    const user = makeUser();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(user) });
    const result = await new GetUserUseCase(repo as any).execute('user-1', tenantId);
    expect(result.id).toBe('user-1');
    expect(result.fullName).toBe('John Doe');
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new GetUserUseCase(repo as any).execute('x', tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── ListUsersUseCase ──────────────────────────────────────────────────────────

describe('ListUsersUseCase', () => {
  it('returns all users for tenant', async () => {
    const repo = makeRepo({
      findAll: jest.fn().mockResolvedValue([makeUser(), makeUser({ id: 'user-2', email: 'b@c.com' })]),
    });
    const result = await new ListUsersUseCase(repo as any).execute(tenantId);
    expect(result).toHaveLength(2);
  });
});

// ── UpdateUserUseCase ─────────────────────────────────────────────────────────

describe('UpdateUserUseCase', () => {
  it('updates firstName and lastName', async () => {
    const user = makeUser();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(user),
      update: jest.fn(),
    });
    const result = await new UpdateUserUseCase(repo as any).execute(
      'user-1',
      { firstName: 'Jane' },
      tenantId,
    );
    expect(result.firstName).toBe('Jane');
    expect(repo.update).toHaveBeenCalled();
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new UpdateUserUseCase(repo as any).execute('x', {}, tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ── DeactivateUserUseCase ─────────────────────────────────────────────────────

describe('DeactivateUserUseCase', () => {
  it('sets isActive to false', async () => {
    const user = makeUser();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(user),
      update: jest.fn(),
    });
    const result = await new DeactivateUserUseCase(repo as any).execute('user-1', tenantId);
    expect(result.isActive).toBe(false);
  });
});

// ── DeleteUserUseCase ─────────────────────────────────────────────────────────

describe('DeleteUserUseCase', () => {
  it('soft-deletes the user', async () => {
    const user = makeUser();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(user),
      delete: jest.fn(),
    });
    await new DeleteUserUseCase(repo as any).execute('user-1', tenantId);
    expect(user.deletedAt).not.toBeNull();
    expect(repo.delete).toHaveBeenCalled();
  });

  it('throws NotFoundException if not found', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      new DeleteUserUseCase(repo as any).execute('x', tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
