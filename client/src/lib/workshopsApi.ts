import { api } from './api';
import type { Workshop, WorkshopStatus } from '../types/registration';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const apiOrigin = new URL(apiBaseUrl).origin;

export type AiSummaryQueueResponse = {
  queued: boolean;
  jobId: string;
  workshopId: string;
  model: string;
};

export type WorkshopPayload = {
  title: string;
  description: string;
  speaker: string;
  room: string;
  roomMapUrl?: string | null;
  startTime: string;
  endTime: string;
  totalSlots: number;
  status?: WorkshopStatus;
  isPaid: boolean;
  price: number;
};

export type RoomMapUploadResponse = {
  workshopId: string;
  roomMapUrl: string;
  workshop: Workshop;
};

export function resolveRoomMapUrl(roomMapUrl: string) {
  if (roomMapUrl.startsWith('/api/')) {
    return `${apiOrigin}${roomMapUrl}`;
  }

  return roomMapUrl;
}

export async function listWorkshops() {
  const response = await api.get<Workshop[]>('/workshops');
  return response.data;
}

export async function getWorkshop(workshopId: string) {
  const response = await api.get<Workshop>(`/workshops/${workshopId}`);
  return response.data;
}

export async function listOrganizerWorkshops() {
  const response = await api.get<Workshop[]>('/workshops/admin');
  return response.data;
}

export async function createWorkshop(payload: WorkshopPayload) {
  const response = await api.post<Workshop>('/workshops', payload);
  return response.data;
}

export async function updateWorkshop(
  workshopId: string,
  payload: Partial<WorkshopPayload>,
) {
  const response = await api.patch<Workshop>(`/workshops/${workshopId}`, payload);
  return response.data;
}

export async function updateWorkshopStatus(
  workshopId: string,
  status: WorkshopStatus,
) {
  const response = await api.patch<Workshop>(`/workshops/${workshopId}/status`, {
    status,
  });
  return response.data;
}

export async function uploadWorkshopRoomMap(workshopId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<RoomMapUploadResponse>(
    `/workshops/${workshopId}/room-map`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

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
