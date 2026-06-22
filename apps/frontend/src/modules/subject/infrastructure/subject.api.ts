import { apiClient } from '@/shared/lib/api-client';
import type { SubjectResponse } from '@/shared/types/api.types';

export interface CreateSubjectDto {
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description?: string | null;
}

export interface UpdateSubjectDto {
  name?: string;
  credits?: number;
  hoursTheory?: number;
  hoursPractice?: number;
  description?: string | null;
}

export const subjectApi = {
  listBySemester: async (semesterId: string): Promise<SubjectResponse[]> => {
    const { data } = await apiClient.get<SubjectResponse[]>(`/semesters/${semesterId}/subjects`);
    return data;
  },

  create: async (semesterId: string, dto: CreateSubjectDto): Promise<SubjectResponse> => {
    const { data } = await apiClient.post<SubjectResponse>(`/semesters/${semesterId}/subjects`, dto);
    return data;
  },

  update: async (id: string, dto: UpdateSubjectDto): Promise<SubjectResponse> => {
    const { data } = await apiClient.put<SubjectResponse>(`/subjects/${id}`, dto);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/subjects/${id}`);
  },

  move: async (id: string, semesterId: string): Promise<SubjectResponse> => {
    const { data } = await apiClient.patch<SubjectResponse>(`/subjects/${id}/move`, { semesterId });
    return data;
  },

  reorder: async (id: string, semesterId: string, position: number): Promise<SubjectResponse> => {
    const { data } = await apiClient.patch<SubjectResponse>(`/subjects/${id}/reorder`, { semesterId, position });
    return data;
  },
};
