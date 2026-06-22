import { apiClient } from '@/shared/lib/api-client';
import type { UniversityResponse } from '@/shared/types/api.types';

export interface CreateUniversityDto {
  name: string;
  code: string;
  country?: string;
  website?: string;
}

export const universityApi = {
  getAll: async (): Promise<UniversityResponse[]> => {
    const { data } = await apiClient.get<UniversityResponse[]>('/universities');
    return data;
  },
  create: async (body: CreateUniversityDto): Promise<UniversityResponse> => {
    const { data } = await apiClient.post<UniversityResponse>('/universities', body);
    return data;
  },
  update: async (id: string, body: Partial<CreateUniversityDto>): Promise<UniversityResponse> => {
    const { data } = await apiClient.put<UniversityResponse>(`/universities/${id}`, body);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/universities/${id}`);
  },
};
