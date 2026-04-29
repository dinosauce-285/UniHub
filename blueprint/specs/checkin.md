# Check-in Spec

## Description

Supports live QR validation and delayed offline synchronization from the PWA.

## Main flow

1. Staff scans a QR code.
2. Online mode calls the backend immediately.
3. Offline mode stores pending entries locally.
4. When connectivity returns, frontend syncs the pending batch to the backend.

## Error scenarios

- Invalid QR payload
- Already checked in registration
- Conflict during delayed sync

## Constraints

- Offline queue must survive tab refresh or temporary disconnection
- Sync endpoint must be idempotent enough to handle retries

## Acceptance criteria

- Online check-in records immediately
- Offline entries can be synced later without data loss

