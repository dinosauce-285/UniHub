import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RATE_LIMIT_POLICIES } from '../../core/rate-limiting/rate-limit.constants';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationService } from './registration.service';

@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.registrationService.listForUser(user.id);
  }

  @Post()
  @Throttle({ default: RATE_LIMIT_POLICIES.registrationWrite })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateRegistrationDto,
    @Headers('idempotency-key') idempotencyKey: string | string[] | undefined,
  ) {
    return this.registrationService.create(user.id, body, idempotencyKey);
  }
}
