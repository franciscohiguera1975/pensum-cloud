import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/database/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserMapper } from '../mappers/user.mapper';

const includeRoles = {
  roles: { include: { role: true } },
} as const;

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: includeRoles,
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), tenantId, deletedAt: null, isActive: true },
      include: includeRoles,
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findAll(tenantId: string): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      include: includeRoles,
      orderBy: { lastName: 'asc' },
    });
    return rows.map(UserMapper.toDomain);
  }

  async existsByEmail(email: string, tenantId: string): Promise<boolean> {
    const row = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), tenantId, deletedAt: null },
    });
    return !!row;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignRoles(userId: string, roleNames: string[]): Promise<void> {
    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
      select: { id: true },
    });
    await this.prisma.userRole.deleteMany({ where: { userId } });
    if (roles.length > 0) {
      await this.prisma.userRole.createMany({
        data: roles.map((r) => ({ userId, roleId: r.id })),
        skipDuplicates: true,
      });
    }
  }
}
