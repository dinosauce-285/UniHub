import { Controller, Post } from '@nestjs/common';

@Controller('notifications')
export class NotificationController {
  @Post('test')
  sendTest() {
    return { queued: true };
  }
}

