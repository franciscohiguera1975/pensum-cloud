import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../../../../../../apps/backend/src/modules/auth/application/use-cases/login.use-case';
import { IAuthTokenService } from '../../../../../../apps/backend/src/modules/auth/domain/services/auth-token.service.interface';
import { IPasswordService } from '../../../../../../apps/backend/src/modules/auth/domain/services/password.service.interface';
import { User } from '../../../../../../apps/backend/src/modules/user/domain/entities/user.entity';
import { IUserRepository } from '../../../../../../apps/backend/src/modules/user/domain/repositories/user.repository.interface';

const makeUser = () =>
  User.reconstitute({
    id: 'user-uuid',
    tenantId: 'tenant-uuid',
    email: 'admin@uni.edu',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    roles: ['ADMIN'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
});

const makePasswordService = (): jest.Mocked<IPasswordService> => ({
  hash: jest.fn(),
  compare: jest.fn(),
});

const makeTokenService = (): jest.Mocked<IAuthTokenService> => ({
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
});

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let passwordService: jest.Mocked<IPasswordService>;
  let tokenService: jest.Mocked<IAuthTokenService>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    passwordService = makePasswordService();
    tokenService = makeTokenService();
    useCase = new LoginUseCase(userRepo, passwordService, tokenService);
  });

  it('should return tokens and user on valid credentials', async () => {
    const user = makeUser();
    userRepo.findByEmail.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(true);
    tokenService.generateTokens.mockReturnValue({
      accessToken: 'access-jwt',
      refreshToken: 'refresh-jwt',
    });

    const result = await useCase.execute({
      email: 'admin@uni.edu',
      password: 'plain-pass',
      tenantId: 'tenant-uuid',
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('admin@uni.edu', 'tenant-uuid');
    expect(passwordService.compare).toHaveBeenCalledWith('plain-pass', 'hashed-password');
    expect(result.accessToken).toBe('access-jwt');
    expect(result.refreshToken).toBe('refresh-jwt');
    expect(result.user.email).toBe('admin@uni.edu');
  });

  it('should throw UnauthorizedException when user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'x@x.com', password: 'pass', tenantId: 'tid' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(passwordService.compare).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when password is wrong', async () => {
    userRepo.findByEmail.mockResolvedValue(makeUser());
    passwordService.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'admin@uni.edu', password: 'wrong', tenantId: 'tenant-uuid' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(tokenService.generateTokens).not.toHaveBeenCalled();
  });
});
