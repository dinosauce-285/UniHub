import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('student-sync')
export class StudentSyncController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  getInfo() {
    return { status: 'ready' };
  }
}
