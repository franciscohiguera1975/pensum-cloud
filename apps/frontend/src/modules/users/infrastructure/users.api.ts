import { apiClient } from '@/shared/lib/api-client';
import type { UserResponse } from '@/shared/types/api.types';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleNames?: string[];
}

export const usersApi = {
  getAll: async (): Promise<UserResponse[]> => {
    const { data } = await apiClient.get<UserResponse[]>('/users');
    return data;
  },
  create: async (body: CreateUserDto): Promise<UserResponse> => {
    const { data } = await apiClient.post<UserResponse>('/users', body);
    return data;
  },
  update: async (id: string, body: { firstName?: string; lastName?: string }): Promise<UserResponse> => {
    const { data } = await apiClient.put<UserResponse>(`/users/${id}`, body);
    return data;
  },
  assignRoles: async (id: string, roleNames: string[]): Promise<UserResponse> => {
    const { data } = await apiClient.put<UserResponse>(`/users/${id}/roles`, { roleNames });
    return data;
  },
  deactivate: async (id: string): Promise<void> => {
    await apiClient.patch(`/users/${id}/deactivate`);
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
