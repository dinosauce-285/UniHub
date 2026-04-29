# Registration Spec

## Description

Handles free and paid workshop registration with slot control, idempotency, and QR generation.

## Main flow

1. Student opens workshop detail.
2. Frontend submits registration with `Idempotency-Key`.
3. Backend claims a slot via Redis atomic decrement.
4. Registration record is persisted and QR code is generated.

## Error scenarios

- No slots remaining
- Duplicate registration request with same key
- Payment flow unavailable for paid events

## Constraints

- One student can register for one workshop only once
- Slot claiming must not rely on DB row locking

## Acceptance criteria

- Concurrent requests do not oversell workshop slots
- Retry with the same idempotency key does not create duplicates

