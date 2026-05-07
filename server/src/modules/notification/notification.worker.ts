import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailNotificationStrategy } from './channels/email-notification.strategy';
import { InAppNotificationStrategy } from './channels/in-app-notification.strategy';
import {
  REGISTRATION_CONFIRMED_JOB,
  type RegistrationNotificationJob,
} from './notification.types';
import { NOTIFICATION_QUEUE } from './notification.service';

@Injectable()
@Processor(NOTIFICATION_QUEUE, { concurrency: 5 })
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly emailStrategy: EmailNotificationStrategy,
    private readonly inAppStrategy: InAppNotificationStrategy,
  ) {
    super();
  }

  async process(job: Job<RegistrationNotificationJob>) {
    if (job.name !== REGISTRATION_CONFIRMED_JOB) {
      this.logger.warn(`Unknown notification job skipped: ${job.name}`);
      return;
    }

    for (const strategy of [this.inAppStrategy, this.emailStrategy]) {
      try {
        await strategy.send(job.data);
      } catch (error) {
        this.logger.error(
          `Notification delivery failed registration=${job.data.registrationId} user=${job.data.userId} channel=${strategy.name} job=${job.id}`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }
  }
}
