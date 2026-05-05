import { api } from './api';
import type { Workshop } from '../types/registration';

export type AiSummaryQueueResponse = {
  queued: boolean;
  jobId: string;
  workshopId: string;
  model: string;
};

export async function listOrganizerWorkshops() {
  const response = await api.get<Workshop[]>('/workshops/admin');
  return response.data;
}

export async function uploadWorkshopAiSummary(workshopId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<AiSummaryQueueResponse>(
    `/workshops/${workshopId}/ai-summary`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}
