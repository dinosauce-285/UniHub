## Why

Registration currently confirms seats and QR codes synchronously, but the notification feature is still a stub. The Blueprint requires students to receive registration confirmation through app-facing feedback and email, with delivery handled asynchronously so registration latency and success are not coupled to SMTP availability.

The notification spec is the source of truth for this change: successful registrations enqueue Bull jobs, the worker sends email through MailHog in development, delivery failures retry without rolling back registration, and channels remain extensible through a strategy pattern.

## What Changes

- Replace the `NotificationController` test stub with a real `NotificationService` that can enqueue registration confirmation jobs.
- Register Bull queue `notification.queue` using the existing Redis-backed BullMQ setup.
- Add a notification worker that consumes registration confirmation jobs and dispatches them through channel strategies.
- Add an email notification strategy implemented with Nodemailer, configured for MailHog on SMTP port 1025 in development.
- Add an in-app strategy boundary that records or returns app-facing notification metadata without introducing a new realtime transport in this slice.
- Wire `RegistrationService` to enqueue a registration confirmation after a registration record and QR payload are created.
- Keep registration success non-blocking: enqueue errors and worker delivery failures must be logged and must not fail or roll back the registration.
- Keep frontend changes minimal by reusing existing registration success toast and pending/QR confirmation surfaces to make the app-facing confirmation visible.

In scope:
- Backend notification queue, service, worker, channel strategy interfaces, and email delivery through MailHog.
- Registration integration after successful free or paid seat claim.
- Minimal frontend copy/state validation around existing registration confirmation and QR display.
- Local verification of queue enqueueing, retry behavior, MailHog delivery, and frontend confirmation messaging.

Out of scope:
- Public internet email delivery, production SMTP setup, templates managed by admins, unsubscribe handling, analytics, read receipts, or notification preferences.
- Realtime websockets, push notifications, Telegram integration, or mobile-native notifications.
- New database notification inbox unless implementation proves it is already present and reusable.
- Changing registration slot claiming, payment, QR generation, check-in, CSV import, AI summary, or rate limiting behavior.
- Broad redesign of student pages or shared toast components.

Key risks:
- If enqueueing happens inside the registration transaction, queue jobs could reference records that later roll back. The implementation should enqueue only after the registration result is durable.
- If SMTP failure is surfaced to the registration request, students could see a failed registration even though their seat was claimed. Worker failures must remain isolated.
- If channel selection is hardcoded inside `RegistrationService`, adding Telegram later would require changing registration code. Channel strategy selection should live inside notification code.
- MailHog configuration must remain development-only and must not silently send email to the public internet.

## Capabilities

### New Capabilities
- `notification`: Deliver asynchronous registration confirmation notifications through a Redis-backed Bull queue and MailHog-backed development email.

### Modified Capabilities
- `registration`: After a successful registration, enqueue notification work without delaying or invalidating the registration response.
- `student-registration-ui`: Preserve existing immediate app confirmation and QR display while aligning copy with the asynchronous email confirmation behavior.

## Impact

- Backend modules: `server/src/modules/notification`, `server/src/modules/registration`, `server/src/app.module.ts`.
- Backend dependencies: add `nodemailer` and its TypeScript types if not already installed.
- Infrastructure: Redis Bull queue and local MailHog SMTP at port 1025.
- Frontend modules: `client/src/pages/student/StudentWorkspace.tsx`, `client/src/pages/student/WorkshopDetailPage.tsx`, and existing `client/src/components/Toast.tsx` only if needed for copy/state reuse.
- APIs: no new public student API is required for this slice. The existing `POST /registrations` response remains the app-facing confirmation path.
- Database: no schema change is required unless a durable in-app notification inbox already exists and should be reused.
