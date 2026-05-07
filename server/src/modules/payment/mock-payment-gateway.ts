import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export type PaymentGatewayRequest = {
  registrationId: string;
  amount: number;
  idempotencyKey: string;
};

export type PaymentGatewayResult = {
  gatewayRef: string;
  amount: number;
  paidAt: string;
};

@Injectable()
export class MockPaymentGateway {
  async charge(request: PaymentGatewayRequest): Promise<PaymentGatewayResult> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (Math.random() < this.failureRate()) {
      throw new Error('Mock payment gateway failed');
    }

    return {
      gatewayRef: `mock_${randomUUID()}`,
      amount: request.amount,
      paidAt: new Date().toISOString(),
    };
  }

  private failureRate() {
    const configured = Number(process.env.MOCK_PAYMENT_FAILURE_RATE ?? 0.3);
    if (!Number.isFinite(configured)) {
      return 0.3;
    }

    return Math.min(Math.max(configured, 0), 1);
  }
}
