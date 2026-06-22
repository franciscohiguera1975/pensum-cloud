import { apiClient } from '@/shared/lib/api-client';
import type { PrerequisiteResponse } from '@/shared/types/api.types';

export const prerequisiteApi = {
  listBySubject: async (subjectId: string): Promise<PrerequisiteResponse[]> => {
    const { data } = await apiClient.get<PrerequisiteResponse[]>(`/subjects/${subjectId}/prerequisites`);
    return data;
  },

  add: async (subjectId: string, requiresId: string): Promise<PrerequisiteResponse> => {
    const { data } = await apiClient.post<PrerequisiteResponse>(`/subjects/${subjectId}/prerequisites`, {
      requiresId,
    });
    return data;
  },

  remove: async (subjectId: string, requiresId: string): Promise<void> => {
    await apiClient.delete(`/subjects/${subjectId}/prerequisites/${requiresId}`);
  },
};
