# Notification Specification

## Purpose
Define how registration confirmations and app-facing notifications are delivered asynchronously without slowing or invalidating the main registration API.

## Requirements

### Requirement: Async registration notification
The system SHALL enqueue registration confirmation notifications asynchronously after successful registration.

#### Scenario: Registration success
- GIVEN a student successfully registers for a workshop
- WHEN the registration API finishes durable registration creation
- THEN the backend enqueues a Bull job in `notification.queue`
- AND immediately returns the registration response with QR details to the student
- AND the frontend shows the existing app-facing confirmation state without waiting for email delivery

#### Scenario: Paid registration success
- GIVEN a student successfully claims a seat for a paid workshop
- WHEN the registration API returns a registration with pending payment
- THEN the backend enqueues a registration confirmation notification
- AND the frontend keeps the pending payment flow available

### Requirement: Email delivery through MailHog
The system SHALL deliver development registration confirmation email through MailHog.

#### Scenario: Email delivery
- GIVEN a registration confirmation job is queued
- WHEN the notification worker processes it
- THEN an email strategy sends the confirmation through Nodemailer
- AND the SMTP target is MailHog on port `1025` in development
- AND the email includes the workshop title, schedule, room, payment status, and QR guidance or payload

### Requirement: Non-blocking notification failures
The system SHALL not fail or roll back registration when notification enqueueing or delivery fails.

#### Scenario: Enqueue failure
- GIVEN a registration has been created successfully
- WHEN enqueueing the notification job fails
- THEN the backend logs the enqueue failure
- AND still returns the successful registration response

#### Scenario: Mail server unavailable
- GIVEN the mail server is unavailable
- WHEN the notification worker attempts delivery
- THEN Bull records the job failure and retries later
- AND the original registration remains successful

### Requirement: Extensible notification channels
The notification module SHALL support adding new channels through a strategy pattern.

#### Scenario: Add chat channel
- GIVEN a developer adds a new notification strategy class
- WHEN the notification module selects notification delivery
- THEN the core registration module does not need to change

## Constraints
- Implementation MUST cover backend API/business logic and the existing frontend user-facing confirmation surface.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Email sending MUST run through Bull Queue.
- Development email MUST route to MailHog, not the public internet.
- Notification errors MUST be logged and must not roll back registration.
- This change MUST NOT add realtime notifications, Telegram, push notifications, notification preferences, public SMTP delivery, or a full notification inbox.
