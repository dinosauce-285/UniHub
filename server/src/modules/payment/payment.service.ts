import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentAttemptStatus,
  PaymentStatus,
} from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  PaymentBreakerService,
  PaymentUnavailableResult,
} from './payment-breaker.service';
import { PaymentGatewayResult } from './mock-payment-gateway';

type PaymentResponse = {
  canPay: true;
  registrationId: string;
  paymentStatus: PaymentStatus;
  amount: number;
  gatewayRef: string | null;
  message: string;
};

type StoredPaymentResponse = PaymentResponse | PaymentUnavailableResult;

const PAYMENT_FAILURE_MESSAGE =
  'Payment gateway failed. Please retry your payment.';

const registrationSelect = {
  id: true,
  userId: true,
  paymentStatus: true,
  workshop: {
    select: {
      id: true,
      isPaid: true,
      price: true,
      title: true,
    },
  },
} as const;

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly breaker: PaymentBreakerService,
  ) {}

  getStatus() {
    return this.breaker.getStatus();
  }

  async payRegistration(
    userId: string,
    registrationId: string,
    idempotencyHeader: string | string[] | undefined,
  ) {
    const idempotencyKey = this.normalizeIdempotencyKey(idempotencyHeader);
    const registration = await this.prisma.registration.findFirst({
      where: {
        id: registrationId,
        userId,
      },
      select: registrationSelect,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (!registration.workshop.isPaid || registration.workshop.price <= 0) {
      throw new BadRequestException('This registration does not require payment');
    }

    const existingAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { idempotencyKey },
    });

    if (existingAttempt) {
      if (existingAttempt.registrationId !== registration.id) {
        throw new ConflictException(
          'Idempotency-Key is already used for another payment',
        );
      }

      return this.replayAttempt(existingAttempt);
    }

    if (registration.paymentStatus === PaymentStatus.PAID) {
      return this.paidResponse(registration.id, registration.workshop.price, null);
    }

    if (registration.paymentStatus !== PaymentStatus.PENDING) {
      throw new ConflictException('Registration is not pending payment');
    }

    const { attempt, created } = await this.createAttempt(
      registration.id,
      idempotencyKey,
      registration.workshop.price,
    );

    if (!created) {
      return this.replayAttempt(attempt);
    }

    let gatewayResult: Awaited<ReturnType<PaymentBreakerService['pay']>>;

    try {
      gatewayResult = await this.breaker.pay({
        registrationId: registration.id,
        amount: registration.workshop.price,
        idempotencyKey,
      });
    } catch (error) {
      await this.storeAttemptResult(
        attempt.id,
        PaymentAttemptStatus.FAILED,
        {
          canPay: true,
          registrationId: registration.id,
          paymentStatus: PaymentStatus.PENDING,
          amount: registration.workshop.price,
          gatewayRef: null,
          message: PAYMENT_FAILURE_MESSAGE,
        },
        null,
      );

      throw new BadGatewayException(PAYMENT_FAILURE_MESSAGE);
    }

    if ('canPay' in gatewayResult && gatewayResult.canPay === false) {
      await this.storeAttemptResult(
        attempt.id,
        PaymentAttemptStatus.FAILED,
        gatewayResult,
        null,
      );
      return gatewayResult;
    }

    const response = await this.markPaid(
      attempt.id,
      registration.id,
      gatewayResult as PaymentGatewayResult,
    );
    return response;
  }

  private normalizeIdempotencyKey(header: string | string[] | undefined) {
    const rawValue = Array.isArray(header) ? header[0] : header;
    const value = rawValue?.trim();

    if (!value) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    if (value.length > 128) {
      throw new BadRequestException('Idempotency-Key header is too long');
    }

    return value;
  }

  private async createAttempt(
    registrationId: string,
    idempotencyKey: string,
    amount: number,
  ) {
    try {
      const attempt = await this.prisma.paymentAttempt.create({
        data: {
          registrationId,
          idempotencyKey,
          amount,
        },
      });

      return { attempt, created: true };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const existing = await this.prisma.paymentAttempt.findUnique({
          where: { idempotencyKey },
        });

        if (existing) {
          return { attempt: existing, created: false };
        }
      }

      throw error;
    }
  }

  private async replayAttempt(attempt: {
    status: PaymentAttemptStatus;
    responseJson: Prisma.JsonValue | null;
  }) {
    if (attempt.status === PaymentAttemptStatus.PENDING) {
      throw new ConflictException('Payment attempt is already in progress');
    }

    if (attempt.status === PaymentAttemptStatus.FAILED) {
      if (attempt.responseJson && this.isUnavailableResponse(attempt.responseJson)) {
        return attempt.responseJson;
      }

      throw new BadGatewayException(PAYMENT_FAILURE_MESSAGE);
    }

    if (attempt.responseJson && this.isStoredPaymentResponse(attempt.responseJson)) {
      return attempt.responseJson;
    }

    throw new ConflictException('Stored payment result is unavailable');
  }

  private async markPaid(
    attemptId: string,
    registrationId: string,
    gatewayResult: PaymentGatewayResult,
  ) {
    const response = this.paidResponse(
      registrationId,
      gatewayResult.amount,
      gatewayResult.gatewayRef,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registrationId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });

      await tx.paymentAttempt.update({
        where: { id: attemptId },
        data: {
          status: PaymentAttemptStatus.SUCCEEDED,
          gatewayRef: gatewayResult.gatewayRef,
          responseJson: response,
        },
      });
    });

    return response;
  }

  private paidResponse(
    registrationId: string,
    amount: number,
    gatewayRef: string | null,
  ): PaymentResponse {
    return {
      canPay: true,
      registrationId,
      paymentStatus: PaymentStatus.PAID,
      amount,
      gatewayRef,
      message: 'Payment confirmed.',
    };
  }

  private async storeAttemptResult(
    attemptId: string,
    status: PaymentAttemptStatus,
    response: StoredPaymentResponse,
    gatewayRef: string | null,
  ) {
    await this.prisma.paymentAttempt.update({
      where: { id: attemptId },
      data: {
        status,
        responseJson: response,
        gatewayRef,
      },
    });
  }

  private isStoredPaymentResponse(value: Prisma.JsonValue): value is StoredPaymentResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'canPay' in value
    );
  }

  private isUnavailableResponse(value: Prisma.JsonValue): value is PaymentUnavailableResult {
    return (
      this.isStoredPaymentResponse(value) &&
      value.canPay === false
    );
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }
}
