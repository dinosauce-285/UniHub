# Proposal: Implement Offline and Online Check-in

## Why
Check-in staff at UniHub Workshop need a fast, reliable method to validate student registrations at the venue door. Given the likelihood of unstable internet connections at event locations, the check-in process must continue without disruption even if the network drops. A resilient, offline-capable check-in system ensures no bottlenecks form and no data is lost.

## What Changes
- **Backend (`CheckinModule`)**: Add API endpoints to validate a single scanned QR code online (`POST /checkin/validate`) and to batch-sync queued offline check-ins (`POST /checkin/sync`).
- **Frontend (PWA)**: Build a check-in surface for `CHECKIN_STAFF` users, integrating a QR scanner component.
- **Frontend Storage**: Integrate IndexedDB to securely queue check-ins while the device is offline, along with a mechanism to detect network status and automatically (or manually) push queued check-ins to the backend when the connection is restored.

## Capabilities
- Online QR code scanning and instant validation.
- Offline fallback: Scanned QRs are queued locally in `IndexedDB`.
- Sync queue: Background or manual submission of offline check-ins when reconnected, handled idempotently to prevent duplicates.

## Impact
- Event check-in staff can manage entry smoothly regardless of network conditions.
- System handles potential interruptions seamlessly, guaranteeing event attendance records are accurate.
