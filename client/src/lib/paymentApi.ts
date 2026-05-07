import { api } from './api';
import type { PaymentResult, PaymentStatusResponse } from '../types/registration';

function createIdempotencyKey() {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getPaymentStatus() {
  const response = await api.get<PaymentStatusResponse>('/payment/status');
  return response.data;
}

export async function payRegistration(registrationId: string) {
  const response = await api.post<PaymentResult>(
    `/payment/registrations/${registrationId}/pay`,
    {},
    {
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
    },
  );

  return response.data;
}
