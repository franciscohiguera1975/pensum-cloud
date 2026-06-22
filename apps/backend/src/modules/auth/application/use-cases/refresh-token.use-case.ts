import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import {
  AUTH_TOKEN_SERVICE,
  IAuthTokenService,
} from '../../domain/services/auth-token.service.interface';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../user/domain/repositories/user.repository.interface';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly authTokenService: IAuthTokenService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<Pick<AuthResponseDto, 'accessToken'>> {
    let payload;
    try {
      payload = this.authTokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(payload.sub, payload.tenantId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const tokens = this.authTokenService.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
    });

    return { accessToken: tokens.accessToken };
  }
}
