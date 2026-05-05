import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
  listLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.studentSyncService.listLogs({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sort,
    });
  }

  @Post('trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER)
  triggerSync() {
    return this.studentSyncService.enqueueManualSync();
  }
}
