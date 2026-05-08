import { api } from './api';
import type { CheckinResult, CheckinSyncResult, PendingCheckin } from '../types/checkin';

export async function validateCheckin(qrCode: string, deviceId: string) {
  const response = await api.post<CheckinResult>('/checkin/validate', {
    qrCode,
    deviceId,
  });
  return response.data;
}

export async function syncCheckins(records: PendingCheckin[]) {
  const response = await api.post<CheckinSyncResult>('/checkin/sync', {
    records: records.map(({ qrCode, checkedInAt, deviceId }) => ({
      qrCode,
      checkedInAt,
      deviceId,
    })),
  });
  return response.data;
}
