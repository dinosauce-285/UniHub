# Specification: Offline & Online Check-in

## Description
Supports event staff in checking students in by scanning QR codes through the PWA. The app supports recording check-ins even when the network is unavailable and automatically syncs when connectivity returns.

## Main Flow
1. Check-in staff scan the student's QR code at the room entrance.
2. **Online**: The PWA calls `POST /checkin/validate` directly. The backend records a `CheckinLog`.
3. **Offline**: The PWA stores temporary check-in logs in IndexedDB `pending_checkins` and shows an OFFLINE label.
4. When the device reconnects (the `navigator.onLine` event), the PWA automatically batches the data and pushes it to `POST /checkin/sync`.
5. The backend records valid logs, and the PWA removes the corresponding data from IndexedDB.

## Error Scenarios
- **Invalid QR**: The API returns 404 and shows an error on screen.
- **QR already checked in**: The API returns 409 (Conflict) "already checked in" and informs staff that the ticket has already been used.
- **Interrupted sync**: The PWA sends a data batch but the network drops halfway through. When online again, the PWA resends the whole batch -> the API guarantees idempotency by only inserting data that does not already exist and avoiding duplicates.

## Constraints
- The offline check-in queue must be stored in `IndexedDB` so it survives tab refreshes or app closure. Do not use `sessionStorage`.
- The sync endpoint `POST /checkin/sync` must be a retry-safe UPSERT block.
- The scan API must require the `CHECKIN_STAFF` role.

## Acceptance Criteria
- Students scanned while online are recorded in the database immediately.
- Tickets scanned while offline are not lost and are checked in successfully after reconnection without duplicated logs.
- The application clearly warns users when it switches to Offline mode.
