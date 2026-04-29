import { Controller, Post } from '@nestjs/common';

@Controller('checkin')
export class CheckinController {
  @Post('sync')
  sync() {
    return {
      synced: 0,
      message: 'Offline sync scaffolded.',
    };
  }
}

