import { apiClient } from '@/shared/lib/api-client';
import type { FacultyResponse } from '@/shared/types/api.types';

export interface CreateFacultyDto {
  name: string;
  code: string;
}

export const facultyApi = {
  listByUniversity: async (universityId: string): Promise<FacultyResponse[]> => {
    const { data } = await apiClient.get<FacultyResponse[]>(`/universities/${universityId}/faculties`);
    return data;
  },
  create: async (universityId: string, body: CreateFacultyDto): Promise<FacultyResponse> => {
    const { data } = await apiClient.post<FacultyResponse>(`/universities/${universityId}/faculties`, body);
    return data;
  },
  update: async (universityId: string, id: string, body: Partial<CreateFacultyDto>): Promise<FacultyResponse> => {
    const { data } = await apiClient.put<FacultyResponse>(`/universities/${universityId}/faculties/${id}`, body);
    return data;
  },
  delete: async (universityId: string, id: string): Promise<void> => {
    await apiClient.delete(`/universities/${universityId}/faculties/${id}`);
  },
};
