## Why

Organizers need a reliable admin workflow to create, update, publish, cancel, and monitor workshops during the career week. The current implementation exposes public workshop listing and an organizer list, but it does not yet provide complete workshop CRUD, workshop detail retrieval, soft cancellation, Redis slot counter initialization during creation, or a full organizer-facing management flow.

Implementing workshop management now gives organizers control over the event schedule and creates a stable source of workshop data for registration, payment, AI summary, and check-in flows.

## What Changes

- Add backend workshop detail retrieval through `GET /workshops/:id`.
- Add organizer-only backend mutations for creating, updating, publishing, cancelling, and completing workshops.
- Add organizer-only room map upload through `POST /workshops/:id/room-map`, storing the uploaded file and returning the persisted `roomMapUrl`.
- Keep workshop cancellation and removal as status changes, not hard deletes.
- Initialize and synchronize Redis slot counters when workshops are created or capacity changes.
- Add real-time slot polling on the public workshop list so displayed availability refreshes from Redis without a full page reload.
- Add a mandatory workshop detail page reachable from the public workshop list.
- Extend the organizer UI from AI-summary-only management into a workshop operations page.
- Add frontend forms and controls for workshop creation, editing, room map upload or URL entry, status changes, capacity visibility, and error handling.

In scope:
- Backend workshop API and business logic in NestJS.
- Redis slot read model initialization and update behavior owned by `WorkshopModule`.
- Room map upload, local serving, and `roomMapUrl` persistence for workshops.
- Public workshop list polling for Redis-backed slot refresh.
- Organizer-facing React UI for workshop management.
- Public workshop detail support for students and guests, including navigation from the workshop list.

Out of scope:
- Student registration slot claiming, QR generation, and idempotency, which are handled by the registration change.
- Payment gateway integration and paid registration authorization.
- AI PDF summary generation internals, except preserving the displayed `aiSummary` field on workshop detail/admin pages.
- Offline check-in scanning and sync.

Key risks:
- Redis slot counters can drift if capacity edits are allowed after registrations exist without careful adjustment.
- Updating `totalSlots` below registered count could make the canonical workshop state invalid.
- Organizer controls must preserve RBAC; accidental public mutation endpoints would expose schedule operations.
- Uploaded room map files must be validated and served safely so arbitrary files are not exposed.
- Slot polling must avoid excessive API traffic and must degrade gracefully when the network is unavailable.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `workshop`: Complete workshop browsing, detail viewing, organizer CRUD, soft cancellation, and Redis-backed slot display.

## Impact

- Backend modules: `server/src/modules/workshop`, `server/src/core/redis`, `server/src/core/prisma`.
- Frontend modules: `client/src/pages/organizer/WorkshopsPage.tsx`, public workshop list UI, workshop API client code, and mandatory route-level workshop detail UI.
- Database: No schema changes expected; uses existing `Workshop` fields.
- Configuration: Requires Redis connection already configured by the registration infrastructure and local static serving for uploaded room maps.
- APIs:
  - `GET /workshops`
  - `GET /workshops/:id`
  - `GET /workshops/admin`
  - `POST /workshops`
  - `PATCH /workshops/:id`
  - `PATCH /workshops/:id/status`
  - `POST /workshops/:id/room-map`
