import { Injectable, Logger } from '@nestjs/common';
import type { NotificationChannelStrategy } from './notification-channel.strategy';
import type { RegistrationNotificationJob } from '../notification.types';

@Injectable()
export class InAppNotificationStrategy implements NotificationChannelStrategy {
  readonly name = 'in-app' as const;
  private readonly logger = new Logger(InAppNotificationStrategy.name);

  async send(job: RegistrationNotificationJob) {
    this.logger.log(
      `In-app registration confirmation available registration=${job.registrationId} user=${job.userId}`,
    );
  }
}
