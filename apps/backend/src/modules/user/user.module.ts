import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { USER_USE_CASES } from './application/use-cases/user.use-cases';
import { UsersController } from './presentation/controllers/users.controller';

// Note: UserModule does NOT import AuthModule to avoid circular dependency
// (AuthModule → UserModule). Passport's JwtStrategy is registered globally
// by AuthModule, so JwtAuthGuard works without explicit import here.
@Module({
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    ...USER_USE_CASES,
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
