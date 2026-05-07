export type WorkshopStatus = 'DRAFT' | 'OPEN' | 'CANCELLED' | 'COMPLETED';

export type Workshop = {
  id: string;
  title: string;
  description: string;
  speaker: string;
  room: string;
  roomMapUrl: string | null;
  startTime: string;
  endTime: string;
  totalSlots: number;
  slotLeft: number;
  status: WorkshopStatus;
  isPaid: boolean;
  price: number;
  aiSummary: string | null;
};

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'FREE' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type Registration = {
  id: string;
  userId: string;
  workshopId: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  qrCode: string | null;
  qrCodeImage: string | null;
  createdAt: string;
  workshop: Pick<
    Workshop,
    'id' | 'title' | 'speaker' | 'room' | 'startTime' | 'endTime' | 'isPaid' | 'price'
  >;
};

export type PaymentStatusResponse = {
  canPay: boolean;
  reason: string | null;
};

export type PaymentResult =
  | {
      canPay: true;
      registrationId: string;
      paymentStatus: PaymentStatus;
      amount: number;
      gatewayRef: string | null;
      message: string;
    }
  | {
      canPay: false;
      reason: string;
    };
