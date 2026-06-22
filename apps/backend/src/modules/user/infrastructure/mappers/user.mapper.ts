import { Prisma } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';

type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

export class UserMapper {
  static toDomain(raw: UserWithRoles): User {
    return User.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      email: raw.email,
      password: raw.password,
      firstName: raw.firstName,
      lastName: raw.lastName,
      isActive: raw.isActive,
      roles: raw.roles.map((ur) => ur.role.name),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
