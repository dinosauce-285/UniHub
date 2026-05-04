import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StudentSyncService } from './student-sync.service';

@Controller('student-sync')
export class StudentSyncController {
  constructor(private readonly studentSyncService: StudentSyncService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  getInfo() {
    return this.studentSyncService.getStatus();
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  listLogs() {
    return this.studentSyncService.listLogs();
  }

  @Post('run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  runNow() {
    return this.studentSyncService.enqueueManualSync();
  }
}
