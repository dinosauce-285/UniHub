# Specification: Notification

## Description
Responsible for sending confirmation emails and in-app notifications to students. Uses Bull Queue to run asynchronously in the background, reducing latency on the main API, and follows the Strategy Pattern so new chat channels can be added later.

## Main Flow
1. A student successfully registers for a workshop.
2. The Backend API places a Notification Job into Bull's `notification.queue` and immediately returns HTTP 201 to the student.
3. The background worker quietly pulls the job and activates the `NotificationStrategy`.
4. Nodemailer sends the email to MailHog through SMTP port 1025 in the development environment.

## Error Scenarios
- **Mail server error or outage**: The job records an internal failure and Bull retries later. The student's event registration flow is not rejected (Non-blocking).
- **Adding a new notification channel**: The pattern lets developers create a new class without touching the core Registration module logic.

## Constraints
- Email sending must run asynchronously through Bull Queue. Do not send email synchronously in a way that blocks the registration API response.
- All emails in the current environment are routed to MailHog for testing and are not sent to the real internet.
- Email sending errors are only logged and must not roll back the user's successful registration transaction.

## Acceptance Criteria
- Registration confirmation returns immediately, and the confirmation email appears shortly afterward in the MailHog inbox.
- The registration API response time does not fluctuate based on email processing time.
- The system remains easy to extend when adding Telegram, Zalo, or similar bots.
