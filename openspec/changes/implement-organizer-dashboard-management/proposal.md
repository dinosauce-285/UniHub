## Why

Organizers need a dashboard to understand workshop health from a small set of reliable aggregate indicators. They also need a student management UI to browse and search imported or synced student users safely without exposing authentication secrets or turning this into full user administration.

The backend APIs provide the data contract for these organizer workflows. The frontend dashboard and student management pages consume those APIs directly, so this change keeps the API and UI work in one unified organizer feature instead of splitting frontend and backend work unnecessarily.

This is organizer-only. It is not full user administration, role management, or a general admin console.

## What Changes

In scope:

Backend:

- Add organizer-only `GET /api/students`.
- Add organizer-only `GET /api/students/:id`.
- Add organizer-only `GET /api/stats/overview`.
- Use safe Prisma selects for student responses.
- Keep all endpoints read-only.

Frontend:

- Add or update the organizer dashboard chart/cards UI consuming `/api/stats/overview`.
- Add or update the organizer student management UI consuming `/api/students`.
- Optionally add a student detail view, modal, or page consuming `/api/students/:id`.
- Add loading, empty, and error states.
- Keep layouts mobile-safe and consistent with the existing UI style.

Out of scope:

- Full user CRUD.
- Role management.
- Student account creation outside existing CSV import or sync behavior.
- Payment or revenue analytics.
- Check-in analytics.
- Time-series analytics.
- Frontend redesign.
- Backend migrations.
- New dependencies.
- Auth, registration, payment, check-in, AI summary, CSV import, or student-sync behavior changes.

## Capabilities

### New Capabilities

- `organizer-dashboard-management`: Organizer Dashboard + Student Management, including backend data APIs and the organizer-only frontend UI that consumes them.

### Modified Capabilities

- None. Existing specs remain unchanged.

## Impact

- Backend modules:
  - Extend `server/src/modules/students` with organizer-only student list/detail APIs.
  - Add `server/src/modules/stats` for overview aggregate stats.
  - Register `StatsModule` in `AppModule`.
- Frontend modules:
  - Reuse existing organizer workspace layout/routes.
  - Add or update organizer dashboard cards/charts.
  - Add or update organizer student management list/search/pagination UI.
  - Add API helpers and TypeScript types as needed.
- Security:
  - All backend endpoints require authenticated `ORGANIZER` access.
  - Frontend routes are protected for `ORGANIZER` only.
  - Student responses exclude password hashes, token hashes, refresh tokens, and auth secrets.
- Database:
  - No migrations expected.
  - No new dependencies expected.
