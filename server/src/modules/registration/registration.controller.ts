import { Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('registrations')
export class RegistrationController {
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  create(@CurrentUser() user: CurrentUserPayload) {
    return {
      status: 'queued',
      userId: user.id,
      message: 'Registration flow scaffolded.',
    };
  }
}
