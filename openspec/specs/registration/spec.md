# Registration Slot Claiming Specification

## Purpose
Define how students register for workshops safely without overselling slots or creating duplicate registrations.

## Requirements

### Requirement: Atomic slot claiming
The system SHALL claim workshop slots with Redis Atomic `DECR` before creating a registration.

#### Scenario: Slot available
- GIVEN a workshop has remaining Redis slot count greater than zero
- WHEN a student sends `POST /registrations`
- THEN the backend decrements the Redis counter
- AND creates a `Registration` record in PostgreSQL
- AND returns status `CONFIRMED` with a QR code

#### Scenario: Workshop full
- GIVEN a workshop Redis slot counter reaches below zero after `DECR`
- WHEN a student attempts to register
- THEN the backend immediately calls `INCR` to return the slot
- AND returns HTTP 409 Workshop is full

### Requirement: Idempotent registration requests
The system SHALL use the `Idempotency-Key` header to prevent duplicate registrations from retries.

#### Scenario: Retry with same key
- GIVEN a previous registration response is cached for an `Idempotency-Key`
- WHEN the same request is retried
- THEN the backend returns the cached response
- AND does not create another database record

#### Scenario: Same student registers twice with different keys
- GIVEN a student already has a registration for a workshop
- WHEN the student attempts another registration for the same workshop
- THEN the database unique constraint rejects the duplicate

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Slot claiming MUST use Redis Atomic `DECR`, not database row locking.
- Idempotency keys MUST be stored in Redis with a 24 hour TTL.
- One student may register for only one ticket per workshop.
