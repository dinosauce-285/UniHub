import { api } from './api';
import { listWorkshops } from './workshopsApi';
import type { Registration } from '../types/registration';

function createIdempotencyKey() {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export { listWorkshops };

export async function listMyRegistrations() {
  const response = await api.get<Registration[]>('/registrations/me');
  return response.data;
}

export async function createRegistration(workshopId: string) {
  const response = await api.post<Registration>(
    '/registrations',
    { workshopId },
    {
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
    },
  );

  return response.data;
}
