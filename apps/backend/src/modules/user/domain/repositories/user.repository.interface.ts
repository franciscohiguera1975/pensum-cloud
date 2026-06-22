import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findAll(tenantId: string): Promise<User[]>;
  existsByEmail(email: string, tenantId: string): Promise<boolean>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
  assignRoles(userId: string, roleNames: string[]): Promise<void>;
}
