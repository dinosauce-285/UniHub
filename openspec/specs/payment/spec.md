# Payment Circuit Breaker Specification

## Purpose
Define how paid workshop registration handles payment gateway failures while preventing duplicate charges.

## Requirements

### Requirement: Paid workshop payment
The system SHALL process payments for paid workshops through a payment gateway wrapped by a Circuit Breaker.

#### Scenario: Successful payment
- GIVEN a student requests payment for a paid workshop
- WHEN the mock payment gateway succeeds
- THEN the backend updates `Registration.paymentStatus` to `PAID`
- AND returns payment confirmation to the student

#### Scenario: Gateway failure below threshold
- GIVEN the payment gateway fails below the circuit threshold
- WHEN the backend attempts payment
- THEN the backend returns HTTP 502
- AND the student can retry

### Requirement: Circuit breaker fallback
The system SHALL fast-fail payment requests when the payment circuit is open.

#### Scenario: Circuit open
- GIVEN gateway failures exceed the 50 percent threshold
- WHEN another payment request arrives
- THEN the Circuit Breaker is OPEN
- AND the backend returns `{ canPay: false }` without calling the gateway

### Requirement: Payment idempotency
The system SHALL prevent duplicate charges using an Idempotency Key.

#### Scenario: Duplicate payment request
- GIVEN a payment request has already completed for an Idempotency Key
- WHEN the same key is submitted again
- THEN the backend returns the previous result
- AND does not call the gateway again

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Use `opossum` with a 50 percent error threshold and 30 second reset timeout.
- Free browsing and free registration MUST continue when the payment circuit is open.
- The mock gateway SHOULD randomly fail 30 percent of the time in development.
