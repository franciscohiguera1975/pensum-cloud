import { apiClient } from '@/shared/lib/api-client';
import type { AuthTokens } from '@/shared/types/api.types';

export const authApi = {
  login: async (email: string, password: string, tenantId: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', { email, password, tenantId });
    return data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
    return data;
  },
};
