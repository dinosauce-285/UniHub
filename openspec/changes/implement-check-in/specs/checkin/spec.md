# Offline and Online Check-in Specification

## Purpose
Define how event staff validate QR codes online and preserve check-ins offline until they can sync.

## Requirements

### Requirement: Online QR check-in
The system SHALL allow check-in staff to scan QR codes and record check-ins while online.

#### Scenario: Valid online QR
- GIVEN check-in staff scans a valid QR code while online
- WHEN the PWA calls `POST /checkin/validate`
- THEN the backend records a `CheckinLog`
- AND returns a successful check-in result

#### Scenario: Invalid QR
- GIVEN check-in staff scans an invalid QR code
- WHEN the backend validates the code
- THEN the backend returns HTTP 404

### Requirement: Offline check-in queue
The PWA SHALL preserve check-in attempts while offline and sync them when connectivity returns.

#### Scenario: Offline scan
- GIVEN the device is offline
- WHEN check-in staff scans a QR code
- THEN the PWA stores the check-in in IndexedDB `pending_checkins`
- AND displays offline status

#### Scenario: Reconnect sync
- GIVEN pending offline check-ins exist
- WHEN the device reconnects
- THEN the PWA sends a batch to `POST /checkin/sync`
- AND removes successfully synced entries from IndexedDB

### Requirement: Idempotent sync
The backend SHALL handle repeated offline sync batches without duplicate logs.

#### Scenario: Interrupted sync retry
- GIVEN a sync batch was partially interrupted
- WHEN the PWA sends the same batch again
- THEN the backend only inserts check-ins that do not already exist

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Offline queue MUST use IndexedDB, not `sessionStorage`.
- Scan APIs MUST require role `CHECKIN_STAFF`.
- `POST /checkin/sync` MUST be retry-safe.
