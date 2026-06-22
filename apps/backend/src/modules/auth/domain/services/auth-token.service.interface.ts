export const AUTH_TOKEN_SERVICE = Symbol('IAuthTokenService');

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthTokenService {
  generateTokens(payload: JwtPayload): AuthTokens;
  verifyRefreshToken(token: string): JwtPayload;
}
