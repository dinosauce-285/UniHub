import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailNotificationStrategy } from './channels/email-notification.strategy';
import { InAppNotificationStrategy } from './channels/in-app-notification.strategy';
import { NOTIFICATION_QUEUE, NotificationService } from './notification.service';
import { NotificationWorker } from './notification.worker';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        maxRetriesPerRequest: null,
      },
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
  ],
  providers: [
    NotificationService,
    NotificationWorker,
    EmailNotificationStrategy,
    InAppNotificationStrategy,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
