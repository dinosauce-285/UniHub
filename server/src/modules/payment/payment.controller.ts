import { Controller, Get } from '@nestjs/common';

@Controller('payment')
export class PaymentController {
  @Get('status')
  getStatus() {
    return {
      canPay: true,
      reason: null,
    };
  }
}

