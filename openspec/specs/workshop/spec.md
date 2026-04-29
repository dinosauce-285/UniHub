# Workshop Specification

## Purpose
CRUD management for workshops, with slot availability displayed from Redis cache.

## Requirements

### Requirement: Workshop Listing
The system SHALL return all workshops with their remaining slot count sourced from Redis.

#### Scenario: Browse workshops
- GIVEN a student (authenticated or unauthenticated view)
- WHEN they call `GET /workshops`
- THEN a list of workshops is returned including title, speaker, room, start/end time, and remaining slots
- AND remaining slots MAY be eventually consistent (sourced from Redis cache)

#### Scenario: Workshop detail
- GIVEN a workshop ID
- WHEN `GET /workshops/:id` is called
- THEN full detail is returned including roomMapUrl, AI summary (if available), and current slot count

### Requirement: Workshop CRUD
The system SHALL allow ORGANIZER users to create, update, and cancel workshops.

#### Scenario: Create workshop
- GIVEN an authenticated ORGANIZER
- WHEN they call `POST /workshops` with valid data
- THEN a workshop is created in PostgreSQL
- AND the Redis slot counter is initialized to `totalSlots`
- AND HTTP 201 is returned

#### Scenario: Update workshop
- GIVEN an authenticated ORGANIZER and an existing workshop
- WHEN they call `PATCH /workshops/:id` with updated fields
- THEN the workshop is updated
- AND if `totalSlots` changed, the Redis counter is adjusted accordingly

#### Scenario: Unauthorized workshop creation
- GIVEN a STUDENT attempting to call `POST /workshops`
- WHEN the request is processed
- THEN HTTP 403 Forbidden is returned

### Requirement: Slot Consistency
The system SHALL maintain Strong Consistency for registration slot writes and Eventual Consistency for display.

#### Scenario: Slot count display (eventual)
- GIVEN Redis slot counter is updated by concurrent registrations
- WHEN a student reads the workshop list
- THEN the displayed count may lag by a few seconds (acceptable stale read)

#### Scenario: Slot claiming (strong)
- GIVEN a workshop with 1 slot remaining
- WHEN two students register simultaneously
- THEN exactly one succeeds (Redis DECR atomic ensures no oversell)

## Constraints
- Remaining slot count for display MUST be read from Redis, not from counting registrations in DB
- ORGANIZER role MUST be required for POST, PATCH, DELETE operations
- Workshop cancellation SHOULD set status flag, not hard-delete

## Acceptance Criteria
- Students can browse all workshops without authentication
- Only ORGANIZERs can create/modify workshops
- Slot count display reflects Redis state; registration write uses atomic Redis DECR
