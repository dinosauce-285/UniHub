# Registration Specification

## Purpose
Handles free and paid workshop registration with atomic slot control, idempotency, and QR generation.

## Requirements

### Requirement: Slot Claiming
The system SHALL claim workshop slots using a Redis atomic DECR operation, not a database row lock.

#### Scenario: Successful slot claim
- GIVEN a workshop with available slots (Redis counter > 0)
- WHEN a student submits `POST /registrations` with a valid Idempotency-Key
- THEN Redis DECR is applied atomically
- AND a Registration record is created with status CONFIRMED
- AND a QR code is generated and returned

#### Scenario: No slots remaining
- GIVEN a workshop where Redis counter is 0
- WHEN a student attempts to register
- THEN Redis DECR returns a negative value, counter is immediately restored with INCR
- AND HTTP 409 is returned with message "workshop is full"
- AND no registration record is created

### Requirement: Idempotency
The system SHALL prevent duplicate registrations using the Idempotency-Key request header.

#### Scenario: Duplicate request same key
- GIVEN a student who has already registered with Idempotency-Key "uuid-123"
- WHEN the same request is replayed with the same key
- THEN the cached result is returned from Redis (TTL 24h)
- AND no new registration is created

#### Scenario: New key for different request
- GIVEN a student submitting a new registration with a fresh UUID key
- WHEN the request is processed
- THEN a new registration is created normally

### Requirement: QR Code Generation
The system SHALL generate a unique QR code for each confirmed registration.

#### Scenario: QR generated on confirmation
- GIVEN a successful registration
- WHEN the registration status becomes CONFIRMED
- THEN a QR code string is generated and stored in the Registration record
- AND the QR code is returned in the API response

### Requirement: One Registration Per Workshop
The system SHALL enforce a unique constraint of one registration per student per workshop.

#### Scenario: Duplicate registration attempt (different key)
- GIVEN a student already registered for a workshop
- WHEN they attempt to register again with a new idempotency key
- THEN HTTP 409 is returned
- AND the database unique constraint `@@unique([userId, workshopId])` prevents duplication

## Constraints
- Slot claiming MUST NOT use database-level locking (D1 pattern via Redis)
- Idempotency keys MUST be stored in Redis with 24-hour TTL
- One student MAY register for a workshop at most once

## Acceptance Criteria
- Concurrent requests for the last slot do not oversell the workshop
- Retry with the same idempotency key returns the original response without creating duplicates
- QR code is present in the response of a successful registration
