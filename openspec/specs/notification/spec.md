# Notification Specification

## Purpose
Define how registration confirmations and in-app notifications are delivered asynchronously without slowing the main API.

## Requirements

### Requirement: Async registration notification
The system SHALL send registration notifications asynchronously after successful registration.

#### Scenario: Registration success
- GIVEN a student successfully registers for a workshop
- WHEN the registration API finishes
- THEN the backend enqueues a job in Bull `notification.queue`
- AND immediately returns HTTP 201 to the student

#### Scenario: Email delivery
- GIVEN a notification job is queued
- WHEN the background worker processes it
- THEN Nodemailer sends the email to MailHog through SMTP port 1025 in development

### Requirement: Non-blocking notification failures
The system SHALL not fail or roll back registration when notification delivery fails.

#### Scenario: Mail server unavailable
- GIVEN the mail server is unavailable
- WHEN the notification worker attempts delivery
- THEN Bull records the job failure and retries later
- AND the original registration remains successful

### Requirement: Extensible notification channels
The notification module SHALL support adding new channels through a strategy pattern.

#### Scenario: Add chat channel
- GIVEN a developer adds a new notification strategy class
- WHEN the module selects notification delivery
- THEN the core registration module does not need to change

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Email sending MUST run through Bull Queue.
- Development email MUST route to MailHog, not the public internet.
- Notification errors MUST be logged and must not roll back registration.
