import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CheckinService } from './checkin.service';
import { SyncCheckinsDto } from './dto/sync-checkin.dto';
import { ValidateCheckinDto } from './dto/validate-checkin.dto';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHECKIN_STAFF)
  validate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: ValidateCheckinDto,
  ) {
    return this.checkinService.validate(user.id, body);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHECKIN_STAFF)
  sync(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: SyncCheckinsDto,
  ) {
    return this.checkinService.sync(user.id, body);
  }
}
