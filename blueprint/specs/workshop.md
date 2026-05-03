# Specification: Workshop Administration (Workshop CRUD)

## Description
Business operations for creating, viewing, updating, and canceling workshop event information, while coordinating Slot Availability from the high-speed Redis cache.

## Main Flow
1. **Browse**: Both guests and students call `GET /workshops`. The backend reads from the DB and enriches the response with available slot counts from Redis.
2. **View detail**: Call `GET /workshops/:id`; the API returns the source content with the room map, AI Summary, and slot count.
3. **Create**: An organizer calls `POST /workshops`. The system creates a record in Postgres and initializes a Redis counter with the total seat count.

## Error Scenarios
- **Seat count changes**: An organizer calls `PATCH` to change room capacity. The backend must update the corresponding Redis seat counter key.
- **Unauthorized access**: A curious `STUDENT` secretly calls `POST /workshops`; the system blocks it immediately with 403 Forbidden.
- **Stale Read**: The UI just showed 2 slots left, but clicking register returns 409 because two other students clicked faster milliseconds earlier. This is accepted because the system follows Eventual Consistency for display data.

## Constraints
- Available slots for display must be read directly from Redis instead of using SQL Count queries in the DB, optimizing read performance.
- Mutating operations (POST, PATCH, DELETE) are fixed to role `ORGANIZER`.
- Deleting or canceling a Workshop must use a Status Flag / Soft Delete, not a permanent Hard Delete from the database.

## Acceptance Criteria
- Guests without accounts can browse the event list screen.
- Organizers can publish workshops smoothly and create the corresponding Redis key.
- The boundary between the read path for counts (Eventual Consistency first) and the write path for counts (Atomic DECR) is managed thoroughly according to the design.
