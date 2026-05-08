# Implementation Tasks: Check-in

## 1. Backend (`server/`)
- [x] 1.1 Generate `CheckinModule`, `CheckinController`, and `CheckinService`.
- [x] 1.2 Implement `POST /checkin/validate` endpoint to handle single QR scan.
    - [x] Find `Registration` by QR code.
    - [x] Return `404` if not found or invalid status.
    - [x] Create `CheckinLog` associating `registrationId` and `staffId` (from JWT).
- [x] 1.3 Implement `POST /checkin/sync` endpoint for batch offline sync.
    - [x] Accept array of check-in records (`qrCode` / `registrationId`, `checkedInAt`).
    - [x] Filter out records that already have a `CheckinLog`.
    - [x] Bulk insert new `CheckinLog`s.
- [x] 1.4 Apply `@Roles('CHECKIN_STAFF')` guard to both endpoints.

## 2. Frontend (`client/`)
- [x] 2.1 Set up `IndexedDB` utility (e.g., `idb-keyval` or custom implementation) to manage `pending_checkins` store.
- [x] 2.2 Create `CheckinPage` restricted to `CHECKIN_STAFF` role.
- [x] 2.3 Integrate a QR scanner component in `CheckinPage`.
- [x] 2.4 Implement Online Flow:
    - [x] Scan triggers `/checkin/validate` directly if `navigator.onLine` is true.
    - [x] Show success or error toast.
- [x] 2.5 Implement Offline Flow:
    - [x] Scan saves record to `IndexedDB` with current timestamp if `navigator.onLine` is false.
    - [x] Show offline success toast.
- [x] 2.6 Implement Sync Logic:
    - [x] Listen to `window.addEventListener('online', ...)` to trigger sync.
    - [x] Send `pending_checkins` to `/checkin/sync`.
    - [x] On success, clear synced records from `IndexedDB`.
