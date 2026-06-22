import { apiClient } from '@/shared/lib/api-client';
import type { CurriculumResponse } from '@/shared/types/api.types';

export interface CreateCurriculumDto {
  version: string;
  name: string;
  description?: string;
  status?: string;
}

export const curriculumApi = {
  listByCareer: async (careerId: string): Promise<CurriculumResponse[]> => {
    const { data } = await apiClient.get<CurriculumResponse[]>(`/careers/${careerId}/curricula`);
    return data;
  },
  getById: async (id: string): Promise<CurriculumResponse> => {
    const { data } = await apiClient.get<CurriculumResponse>(`/curricula/${id}`);
    return data;
  },
  create: async (careerId: string, body: CreateCurriculumDto): Promise<CurriculumResponse> => {
    const { data } = await apiClient.post<CurriculumResponse>(`/careers/${careerId}/curricula`, body);
    return data;
  },
  update: async (id: string, body: Partial<CreateCurriculumDto>): Promise<CurriculumResponse> => {
    const { data } = await apiClient.put<CurriculumResponse>(`/curricula/${id}`, body);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/curricula/${id}`);
  },
};
