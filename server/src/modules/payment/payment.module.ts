import { Module } from '@nestjs/common';
import { MockPaymentGateway } from './mock-payment-gateway';
import { PaymentBreakerService } from './payment-breaker.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  providers: [MockPaymentGateway, PaymentBreakerService, PaymentService],
})
export class PaymentModule {}
