import { Controller, Get } from '@nestjs/common';

@Controller('student-sync')
export class StudentSyncController {
  @Get()
  getInfo() {
    return { status: 'ready' };
  }
}

