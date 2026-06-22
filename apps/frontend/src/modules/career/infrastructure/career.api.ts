import { apiClient } from '@/shared/lib/api-client';
import type { CareerResponse } from '@/shared/types/api.types';

export interface CreateCareerDto {
  name: string;
  code: string;
  description?: string;
}

export const careerApi = {
  listByFaculty: async (facultyId: string): Promise<CareerResponse[]> => {
    const { data } = await apiClient.get<CareerResponse[]>(`/faculties/${facultyId}/careers`);
    return data;
  },
  create: async (facultyId: string, body: CreateCareerDto): Promise<CareerResponse> => {
    const { data } = await apiClient.post<CareerResponse>(`/faculties/${facultyId}/careers`, body);
    return data;
  },
  update: async (facultyId: string, id: string, body: Partial<CreateCareerDto>): Promise<CareerResponse> => {
    const { data } = await apiClient.put<CareerResponse>(`/faculties/${facultyId}/careers/${id}`, body);
    return data;
  },
  delete: async (facultyId: string, id: string): Promise<void> => {
    await apiClient.delete(`/faculties/${facultyId}/careers/${id}`);
  },
};
