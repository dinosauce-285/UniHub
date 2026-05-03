import { Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('checkin')
export class CheckinController {
  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHECKIN_STAFF)
  sync() {
    return {
      synced: 0,
      message: 'Offline sync scaffolded.',
    };
  }
}
