import { apiClient } from '@/shared/lib/api-client';
import type { SemesterResponse } from '@/shared/types/api.types';

export interface CreateSemesterDto {
  number: number;
  name?: string;
}

export interface UpdateSemesterDto {
  name?: string;
}

export const semesterApi = {
  listByCurriculum: async (curriculumId: string): Promise<SemesterResponse[]> => {
    const { data } = await apiClient.get<SemesterResponse[]>(`/curricula/${curriculumId}/semesters`);
    return data;
  },

  create: async (curriculumId: string, dto: CreateSemesterDto): Promise<SemesterResponse> => {
    const { data } = await apiClient.post<SemesterResponse>(`/curricula/${curriculumId}/semesters`, dto);
    return data;
  },

  update: async (id: string, dto: UpdateSemesterDto): Promise<SemesterResponse> => {
    const { data } = await apiClient.put<SemesterResponse>(`/semesters/${id}`, dto);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/semesters/${id}`);
  },
};
