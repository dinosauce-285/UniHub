## Why

Students need a reliable way to register for workshops. Because popular workshops can fill up instantly, the system must prevent overselling slots even under high concurrent load. Additionally, unreliable network connections require clients to retry requests without risking duplicate registrations or duplicate payments.

Implementing registration now unblocks the check-in and payment flows that depend on existing registration records.

## What Changes

- Add `RedisModule` and `RedisService` to interact with Redis.
- Implement atomic slot claiming using Redis `DECR` in `RegistrationService`.
- Ensure idempotency for `POST /registrations` by caching responses in Redis based on the `Idempotency-Key` header.
- Implement `WorkshopService` to list available open workshops.
- Replace the registration controller stub with real logic that claims a slot and persists a `Registration` record in PostgreSQL via Prisma.
- Generate a unique QR code payload for each confirmed registration.
- Add frontend UI in `StudentWorkspace` to display available workshops with remaining slot capacity, allow claiming a seat, and show the student's confirmed registrations and latest QR code.
- Generate idempotency keys on the frontend for registration requests to allow safe retries.

In scope:
- Backend registration and workshop listing logic in NestJS.
- Redis integration for atomicity and idempotency.
- Frontend registration UI in React for the Student workspace.

Out of scope:
- Payment gateway integration (handled in separate payment spec).
- Workshop management by organizers (creation, editing, opening).
- Check-in scanning logic.

Key risks:
- Redis must be available and correctly configured, otherwise registration will fail.
- Slot count drift if Redis `DECR` and database transactions get out of sync during crash scenarios.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `registration`: Clarify that registration uses Redis atomic decrement for slot reservation and requires an Idempotency-Key for safe retries.

## Impact

- Backend modules: `server/src/modules/registration`, `server/src/modules/workshop`, `server/src/core/redis`.
- Frontend modules: `client/src/features/registration`, `client/src/App.tsx`.
- Database: Insert `Registration` records and decrement `slotLeft` on `Workshop`.
- Configuration: Requires Redis connection configuration.
- APIs: `POST /registrations` now accepts `Idempotency-Key` header and returns full registration data including QR code image. `GET /registrations/me` added to list a student's registrations. `GET /workshops` added to list open workshops.
