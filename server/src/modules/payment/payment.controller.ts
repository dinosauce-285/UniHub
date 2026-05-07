import { Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('status')
  getStatus() {
    return this.paymentService.getStatus();
  }

  @Post('registrations/:registrationId/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  payRegistration(
    @CurrentUser() user: CurrentUserPayload,
    @Param('registrationId') registrationId: string,
    @Headers('idempotency-key') idempotencyKey: string | string[] | undefined,
  ) {
    return this.paymentService.payRegistration(
      user.id,
      registrationId,
      idempotencyKey,
    );
  }
}
