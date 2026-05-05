import { api } from './api';
import type {
  StudentSyncLogResponse,
  StudentSyncTriggerResponse,
} from '../types/studentSync';

export async function fetchStudentSyncLogs() {
  const response = await api.get<StudentSyncLogResponse>('/student-sync');
  return response.data;
}

export async function triggerStudentSync() {
  const response = await api.post<StudentSyncTriggerResponse>('/student-sync/trigger');
  return response.data;
}
