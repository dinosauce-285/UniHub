import type { PaymentStatus } from '../../../generated/prisma/enums';

export const REGISTRATION_CONFIRMED_JOB = 'registration-confirmed';

export type RegistrationNotificationJob = {
  type: typeof REGISTRATION_CONFIRMED_JOB;
  registrationId: string;
  userId: string;
  studentEmail: string;
  studentName: string;
  workshop: {
    id: string;
    title: string;
    room: string;
    startTime: string;
    endTime: string;
    isPaid: boolean;
  };
  paymentStatus: PaymentStatus;
  qrCode: string | null;
};

export type NotificationChannelName = 'email' | 'in-app';
