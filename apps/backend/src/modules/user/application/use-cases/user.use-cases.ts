import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { AssignRolesDto, CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';

// ── Mapper (inline) ───────────────────────────────────────────────────────────

function toResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    isActive: user.isActive,
    roles: user.roles,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ── CreateUserUseCase ─────────────────────────────────────────────────────────

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto, tenantId: string): Promise<UserResponseDto> {
    const exists = await this.repo.existsByEmail(dto.email, tenantId);
    if (exists) throw new ConflictException(`Email '${dto.email}' already registered`);

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = User.create({
      id: uuidv4(),
      tenantId,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.repo.save(user);

    const roleNames = dto.roleNames && dto.roleNames.length > 0 ? dto.roleNames : ['VIEWER'];
    await this.repo.assignRoles(user.id, roleNames);

    const saved = await this.repo.findById(user.id, tenantId);
    return toResponse(saved ?? user);
  }
}

// ── GetUserUseCase ────────────────────────────────────────────────────────────

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<UserResponseDto> {
    const user = await this.repo.findById(id, tenantId);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return toResponse(user);
  }
}

// ── ListUsersUseCase ──────────────────────────────────────────────────────────

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async execute(tenantId: string): Promise<UserResponseDto[]> {
    const list = await this.repo.findAll(tenantId);
    return list.map(toResponse);
  }
}

// ── UpdateUserUseCase ─────────────────────────────────────────────────────────

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async execute(id: string, dto: UpdateUserDto, tenantId: string): Promise<UserResponseDto> {
    const user = await this.repo.findById(id, tenantId);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.update(dto);
    await this.repo.update(user);
    return toResponse(user);
  }
}

// ── AssignRolesUseCase ────────────────────────────────────────────────────────

@Injectable()
export class AssignRolesUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async execute(id: string, dto: AssignRolesDto, tenantId: string): Promise<UserResponseDto> {
    const user = await this.repo.findById(id, tenantId);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.repo.assignRoles(id, dto.roleNames);
    const updated = await this.repo.findById(id, tenantId);
    return toResponse(updated!);
  }
}

// ── DeactivateUserUseCase ─────────────────────────────────────────────────────

@Injectable()
export class DeactivateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<UserResponseDto> {
    const user = await this.repo.findById(id, tenantId);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.deactivate();
    await this.repo.update(user);
    return toResponse(user);
  }
}

// ── DeleteUserUseCase ─────────────────────────────────────────────────────────

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const user = await this.repo.findById(id, tenantId);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.softDelete();
    await this.repo.delete(id, tenantId);
  }
}

export const USER_USE_CASES = [
  CreateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
  AssignRolesUseCase,
  DeactivateUserUseCase,
  DeleteUserUseCase,
];
