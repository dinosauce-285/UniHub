## 1. Backend Queue Setup

- [x] 1.1 Replace the notification test stub with a real `NotificationService`.
- [x] 1.2 Add `NOTIFICATION_QUEUE = 'notification.queue'`.
- [x] 1.3 Register the Bull queue in `NotificationModule` using the existing Redis URL convention.
- [x] 1.4 Export `NotificationService` from `NotificationModule`.
- [x] 1.5 Keep or remove `NotificationController` only if it serves a real protected diagnostic need; do not keep an unauthenticated fake send endpoint.

## 2. Notification Payload And Strategies

- [x] 2.1 Define a serializable `RegistrationNotificationJob` payload type.
- [x] 2.2 Add a channel strategy interface for notification delivery.
- [x] 2.3 Add an email strategy backed by Nodemailer.
- [x] 2.4 Configure Nodemailer for MailHog defaults: host `localhost`, port `1025`, and local sender address.
- [x] 2.5 Add an in-app strategy boundary without introducing a new realtime transport or notification inbox.
- [x] 2.6 Keep channel selection inside the notification module so future channels do not require registration module changes.

## 3. Notification Worker

- [x] 3.1 Add `NotificationWorker` using `@Processor(NOTIFICATION_QUEUE)`.
- [x] 3.2 Process `registration-confirmed` jobs.
- [x] 3.3 Dispatch jobs through configured channel strategies.
- [x] 3.4 Configure retry attempts and backoff for delivery failures.
- [x] 3.5 Log job failures with registration id, user id, channel, and job id.
- [x] 3.6 Ensure delivery failures throw from the worker so Bull records and retries them.

## 4. Registration Integration

- [x] 4.1 Import `NotificationModule` into `RegistrationModule`.
- [x] 4.2 Inject `NotificationService` into `RegistrationService`.
- [x] 4.3 Build the notification payload after registration creation includes user, workshop, payment status, and QR details.
- [x] 4.4 Enqueue registration confirmation only after the registration record is durable.
- [x] 4.5 Do not fail or roll back registration if enqueueing fails; log the enqueue failure instead.
- [x] 4.6 Avoid duplicate notification jobs for cached idempotency responses.
- [x] 4.7 Preserve existing slot claiming, idempotency, payment status, and QR generation behavior.

## 5. Frontend Confirmation Surface

- [x] 5.1 Review existing student registration toast and QR confirmation UI before adding any component.
- [x] 5.2 Reuse existing `Toast` and confirmation surfaces for app-facing registration notification.
- [x] 5.3 Adjust successful registration copy only if needed to mention email confirmation is being sent.
- [x] 5.4 Preserve paid-registration pending payment flow and free-registration QR display.
- [x] 5.5 Do not add a notification center, websocket, polling inbox, or broad student page redesign.

## 6. Configuration And Dependencies

- [x] 6.1 Add `nodemailer` and `@types/nodemailer` if they are not already installed.
- [x] 6.2 Add or document `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`, and `NOTIFICATION_EMAIL_ENABLED` environment defaults.
- [x] 6.3 Ensure development email uses MailHog and does not default to public SMTP.
- [x] 6.4 Keep Redis/Bull configuration consistent with existing queue modules.

## 7. Verification

- [x] 7.1 Run the backend build.
- [x] 7.2 Run the frontend build if frontend copy or components change.
- [ ] 7.3 Verify a free registration returns immediately and enqueues a notification job.
- [ ] 7.4 Verify a paid registration returns immediately, remains pending payment, and enqueues a notification job.
- [ ] 7.5 Verify MailHog receives a registration confirmation email.
- [ ] 7.6 Verify stopping MailHog causes worker retry/failure without failing or rolling back registration.
- [ ] 7.7 Verify an idempotent registration retry does not enqueue duplicate confirmation emails.
- [ ] 7.8 Verify a new notification strategy can be registered without modifying `RegistrationService`.
