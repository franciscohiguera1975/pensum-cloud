import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from '../../../../../../apps/backend/src/modules/auth/application/use-cases/refresh-token.use-case';
import { IAuthTokenService, JwtPayload } from '../../../../../../apps/backend/src/modules/auth/domain/services/auth-token.service.interface';
import { User } from '../../../../../../apps/backend/src/modules/user/domain/entities/user.entity';
import { IUserRepository } from '../../../../../../apps/backend/src/modules/user/domain/repositories/user.repository.interface';

const makeUser = () =>
  User.reconstitute({
    id: 'user-uuid',
    tenantId: 'tenant-uuid',
    email: 'admin@uni.edu',
    password: 'hashed',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    roles: ['ADMIN'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const makePayload = (): JwtPayload => ({
  sub: 'user-uuid',
  email: 'admin@uni.edu',
  tenantId: 'tenant-uuid',
  roles: ['ADMIN'],
});

const makeUserRepo = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
});

const makeTokenService = (): jest.Mocked<IAuthTokenService> => ({
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
});

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let tokenService: jest.Mocked<IAuthTokenService>;

  beforeEach(() => {
    userRepo = makeUserRepo();
    tokenService = makeTokenService();
    useCase = new RefreshTokenUseCase(tokenService, userRepo);
  });

  it('should return a new accessToken', async () => {
    tokenService.verifyRefreshToken.mockReturnValue(makePayload());
    userRepo.findById.mockResolvedValue(makeUser());
    tokenService.generateTokens.mockReturnValue({
      accessToken: 'new-access-jwt',
      refreshToken: 'new-refresh-jwt',
    });

    const result = await useCase.execute({ refreshToken: 'valid-refresh' });

    expect(result.accessToken).toBe('new-access-jwt');
  });

  it('should throw when refresh token is invalid', async () => {
    tokenService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await expect(
      useCase.execute({ refreshToken: 'expired-token' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when user no longer exists', async () => {
    tokenService.verifyRefreshToken.mockReturnValue(makePayload());
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'valid-refresh' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
