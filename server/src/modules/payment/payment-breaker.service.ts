import { Injectable, OnModuleDestroy } from '@nestjs/common';
import CircuitBreaker = require('opossum');
import {
  MockPaymentGateway,
  PaymentGatewayRequest,
  PaymentGatewayResult,
} from './mock-payment-gateway';

export type PaymentUnavailableResult = {
  canPay: false;
  reason: string;
};

const PAYMENT_UNAVAILABLE_REASON =
  'Payment gateway is temporarily unavailable. Please try again later.';

@Injectable()
export class PaymentBreakerService implements OnModuleDestroy {
  private readonly breaker: CircuitBreaker<
    PaymentGatewayResult | PaymentUnavailableResult
  >;

  constructor(private readonly gateway: MockPaymentGateway) {
    this.breaker = new CircuitBreaker(
      (request: PaymentGatewayRequest) => this.gateway.charge(request),
      {
        name: 'mock-payment-gateway',
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30_000,
        volumeThreshold: 2,
      },
    );

    this.breaker.fallback((request: PaymentGatewayRequest, error: Error) => {
      if (this.breaker.opened) {
        return this.unavailable();
      }

      throw error;
    });
  }

  getStatus() {
    if (this.breaker.opened) {
      return this.unavailable();
    }

    return {
      canPay: true,
      reason: null,
    };
  }

  async pay(request: PaymentGatewayRequest) {
    if (this.breaker.opened) {
      return this.unavailable();
    }

    return this.breaker.fire(request);
  }

  onModuleDestroy() {
    this.breaker.shutdown();
  }

  private unavailable(): PaymentUnavailableResult {
    return {
      canPay: false,
      reason: PAYMENT_UNAVAILABLE_REASON,
    };
  }
}
