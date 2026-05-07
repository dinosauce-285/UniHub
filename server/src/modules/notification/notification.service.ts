import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  REGISTRATION_CONFIRMED_JOB,
  type RegistrationNotificationJob,
} from './notification.types';

export const NOTIFICATION_QUEUE = 'notification.queue';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue<RegistrationNotificationJob>,
  ) {}

  async enqueueRegistrationConfirmation(job: RegistrationNotificationJob) {
    try {
      await this.notificationQueue.add(REGISTRATION_CONFIRMED_JOB, job, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5_000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue registration notification for ${job.registrationId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
