import type {
  NotificationChannelName,
  RegistrationNotificationJob,
} from '../notification.types';

export interface NotificationChannelStrategy {
  readonly name: NotificationChannelName;
  send(job: RegistrationNotificationJob): Promise<void>;
}
