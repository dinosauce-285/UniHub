# Notification Specification

## Purpose
Async email and in-app notification delivery via Bull Queue, designed for easy channel extension.

## Requirements

### Requirement: Registration Confirmation Notification
The system SHALL send a confirmation notification after a successful workshop registration.

#### Scenario: Email notification sent
- GIVEN a student who just completed a registration
- WHEN the registration is confirmed
- THEN a Bull job is enqueued to send a confirmation email via Nodemailer → MailHog
- AND the registration API response is returned immediately (notification is non-blocking)

#### Scenario: Notification does not block registration
- GIVEN a temporary email delivery failure
- WHEN a registration is successfully completed
- THEN the registration API returns HTTP 201
- AND the email failure is logged but does not affect the registration result

### Requirement: Extensible Channel Design
The system SHALL be designed so new notification channels (e.g., Telegram, SMS) can be added without changing the registration flow.

#### Scenario: Adding a new channel
- GIVEN a new notification channel is to be added
- WHEN a developer creates a new NotificationStrategy class
- THEN the existing registration and notification queue code is unchanged
- AND the new channel is activated by adding it to the notification module configuration

## Constraints
- Notification delivery MUST be async via Bull Queue — MUST NOT block the registration flow
- Email transport MUST route through MailHog in development (SMTP port 1025)
- Notification failures MUST be logged but MUST NOT cause registration rollback

## Acceptance Criteria
- Student receives an email in MailHog after successful registration
- Registration API response time is not affected by notification processing
