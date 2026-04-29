# Check-in Specification

## Purpose
Supports live QR validation and delayed offline synchronization from the PWA check-in app.

## Requirements

### Requirement: Online QR Validation
The system SHALL validate a student's QR code in real time when network is available.

#### Scenario: Valid QR, online
- GIVEN a check-in staff member with network connectivity
- WHEN they scan a valid QR code and call `POST /checkin/validate`
- THEN a CheckinLog record is created with `checkedInAt = now()`
- AND HTTP 200 is returned with confirmation

#### Scenario: Invalid QR payload
- GIVEN a QR that does not correspond to any registration
- WHEN `POST /checkin/validate` is called
- THEN HTTP 404 is returned with an appropriate error message

#### Scenario: Already checked in
- GIVEN a student who has already been checked in
- WHEN their QR is scanned again
- THEN HTTP 409 is returned with message "already checked in"

### Requirement: Offline Check-in Queue
The system SHALL allow the PWA to store check-in events locally when network is unavailable.

#### Scenario: Offline check-in stored locally
- GIVEN the PWA has no network connectivity
- WHEN staff scans a QR code
- THEN the event is saved to IndexedDB `pending_checkins` store
- AND the UI displays a "OFFLINE MODE" badge with pending count

#### Scenario: Queue persists across tab refresh
- GIVEN pending check-ins in IndexedDB
- WHEN the tab is refreshed
- THEN IndexedDB entries remain intact and the pending count is restored

### Requirement: Offline Sync
The system SHALL sync pending check-in events to the backend when connectivity is restored.

#### Scenario: Sync on reconnect
- GIVEN pending check-ins in IndexedDB and a restored network connection
- WHEN the `navigator.onLine` event fires
- THEN the PWA calls `POST /checkin/sync` with the pending batch
- AND successfully synced entries are removed from IndexedDB

#### Scenario: Sync endpoint idempotency
- GIVEN a sync batch that was partially processed (connection dropped mid-sync)
- WHEN the PWA retries the full batch
- THEN already-synced entries are accepted without error (idempotent upsert)
- AND `syncedAt` is updated only for newly synced records

## Constraints
- Offline queue MUST survive tab refresh (IndexedDB, not sessionStorage)
- `POST /checkin/sync` MUST be idempotent for retries
- Check-in staff MUST be authenticated with role CHECKIN_STAFF

## Acceptance Criteria
- Online check-in records immediately to the database
- Offline entries can be synced after reconnect without data loss or duplicates
- The PWA clearly indicates offline mode and pending item count
