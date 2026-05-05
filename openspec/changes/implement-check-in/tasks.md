# Implementation Tasks: Check-in

## 1. Backend (`server/`)
- [ ] 1.1 Generate `CheckinModule`, `CheckinController`, and `CheckinService`.
- [ ] 1.2 Implement `POST /checkin/validate` endpoint to handle single QR scan.
    - [ ] Find `Registration` by QR code.
    - [ ] Return `404` if not found or invalid status.
    - [ ] Create `CheckinLog` associating `registrationId` and `staffId` (from JWT).
- [ ] 1.3 Implement `POST /checkin/sync` endpoint for batch offline sync.
    - [ ] Accept array of check-in records (`qrCode` / `registrationId`, `checkedInAt`).
    - [ ] Filter out records that already have a `CheckinLog`.
    - [ ] Bulk insert new `CheckinLog`s.
- [ ] 1.4 Apply `@Roles('CHECKIN_STAFF')` guard to both endpoints.

## 2. Frontend (`client/`)
- [ ] 2.1 Set up `IndexedDB` utility (e.g., `idb-keyval` or custom implementation) to manage `pending_checkins` store.
- [ ] 2.2 Create `CheckinPage` restricted to `CHECKIN_STAFF` role.
- [ ] 2.3 Integrate a QR scanner component in `CheckinPage`.
- [ ] 2.4 Implement Online Flow:
    - [ ] Scan triggers `/checkin/validate` directly if `navigator.onLine` is true.
    - [ ] Show success or error toast.
- [ ] 2.5 Implement Offline Flow:
    - [ ] Scan saves record to `IndexedDB` with current timestamp if `navigator.onLine` is false.
    - [ ] Show offline success toast.
- [ ] 2.6 Implement Sync Logic:
    - [ ] Listen to `window.addEventListener('online', ...)` to trigger sync.
    - [ ] Send `pending_checkins` to `/checkin/sync`.
    - [ ] On success, clear synced records from `IndexedDB`.
