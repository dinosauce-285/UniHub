# Specification: Registration Slot Claiming

## Description
Handles workshop registration for both free and paid workshops. It is responsible for fully safe Slot Claiming through an atomic Redis command, and it also generates a check-in QR code after successful registration.

## Main Flow
1. A student clicks Register on the Workshop detail page.
2. The frontend sends `POST /registrations` with a randomly generated UUID as the `Idempotency-Key` header.
3. The backend calls `DECR` on that workshop's Redis counter to claim one slot.
4. If slots remain (`DECR` >= 0): insert a `Registration` record into PostgreSQL, generate a QR Code, and return status `CONFIRMED`.
5. If the workshop is full (`DECR` < 0): immediately call `INCR` to return the slot to Redis, then return HTTP 409 (Workshop is full).

## Error Scenarios
- **Full workshop (Race Condition)**: Many users compete for the final ticket. Redis executes `DECR` sequentially in memory, so only one user receives result 0; the rest receive negative numbers and are rejected fairly.
- **Repeated request with the same key**: A student clicks the button multiple times, creating requests with the same `Idempotency-Key` -> the backend catches it in Redis, returns the previous result, and does not touch the DB.
- **Multiple registrations with different keys**: A student intentionally tries to register twice for one event -> the database rejects it through the Unique Constraint `@@unique([userId, workshopId])`.

## Constraints
- Slot Claiming must use Redis Atomic DECR. Do not use DB Row Locking (`SELECT FOR UPDATE`) to avoid bottlenecks.
- The Idempotency-Key is stored in Redis with a TTL of 24 hours.
- A student can register for only one ticket per workshop.

## Acceptance Criteria
- The system can withstand traffic bursts without blocking the DB and with 100% prevention of ticket overselling.
- Retrying an old request never creates two different records.
- A valid QR code is included in the response after registration is complete.
