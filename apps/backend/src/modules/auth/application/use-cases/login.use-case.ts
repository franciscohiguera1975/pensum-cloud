import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../user/domain/repositories/user.repository.interface';
import {
  AUTH_TOKEN_SERVICE,
  IAuthTokenService,
} from '../../domain/services/auth-token.service.interface';
import {
  IPasswordService,
  PASSWORD_SERVICE,
} from '../../domain/services/password.service.interface';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly authTokenService: IAuthTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    // Resolve tenant: accept both slug ("demo-university") and UUID
    let tenantId = dto.tenantId;
    if (!UUID_REGEX.test(tenantId)) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantId },
        select: { id: true, isActive: true },
      });
      if (!tenant || !tenant.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }
      tenantId = tenant.id;
    }

    const user = await this.userRepository.findByEmail(dto.email, tenantId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.passwordService.compare(
      dto.password,
      user.password,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.authTokenService.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
    });

    const response = new AuthResponseDto();
    response.accessToken = tokens.accessToken;
    response.refreshToken = tokens.refreshToken;
    response.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
    };
    return response;
  }
}
