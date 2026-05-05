## 1. Backend API

- [x] 1.1 Create workshop DTOs for create, update, and status transitions.
- [x] 1.2 Add `GET /workshops/:id` for public workshop detail with Redis slot hydration.
- [x] 1.3 Add organizer-only `POST /workshops` to create workshops.
- [x] 1.4 Add organizer-only `PATCH /workshops/:id` to update workshop content, schedule, room, pricing, and capacity.
- [x] 1.5 Add organizer-only `PATCH /workshops/:id/status` for publish, cancel, and complete transitions.
- [x] 1.6 Add organizer-only `POST /workshops/:id/room-map` using multipart file upload.
- [x] 1.7 Validate room map uploads by MIME type, extension, practical file signature checks, and 5 MB max size.
- [x] 1.8 Store room map files under the configured room map upload directory using collision-resistant filenames.
- [x] 1.9 Serve uploaded room maps from a documented static URL and persist that URL in `Workshop.roomMapUrl`.
- [x] 1.10 Allow create/update DTOs to accept a valid manual `roomMapUrl`.
- [x] 1.11 Return HTTP 404 for unknown workshop IDs.
- [x] 1.12 Return HTTP 400 for invalid schedules, invalid pricing, invalid capacity, invalid room map URLs, or invalid room map files.
- [x] 1.13 Ensure all mutation and upload handlers use `JwtAuthGuard`, `RolesGuard`, and `@Roles(Role.ORGANIZER)`.

## 2. Backend Slot Read Model

- [x] 2.1 Extract shared Redis slot hydration helper in `WorkshopService`.
- [x] 2.2 Initialize Redis slot counter on workshop creation.
- [x] 2.3 Initialize missing Redis slot counters on public list/detail with `SET NX`.
- [x] 2.4 Recompute and replace Redis slot counter when capacity changes.
- [x] 2.5 Reject capacity reductions below active registration count.

## 3. Frontend Organizer UI

- [x] 3.1 Extend `client/src/lib/workshopsApi.ts` with typed CRUD and status update functions.
- [x] 3.2 Add typed room map upload call to `client/src/lib/workshopsApi.ts`.
- [x] 3.3 Update `WorkshopsPage` to show all workshops with status, schedule, room, price, room map, and capacity.
- [x] 3.4 Add create workshop form with validation feedback.
- [x] 3.5 Add edit workshop flow for existing workshops.
- [x] 3.6 Add room map file input and manual room map URL field to the create/edit form.
- [x] 3.7 Upload selected room map files, update the form with the returned `roomMapUrl`, and show upload errors without losing unsaved form data.
- [x] 3.8 Add publish, cancel, and complete controls with loading and error states.
- [x] 3.9 Preserve AI summary upload and display inside the organizer workshop page.

## 4. Frontend Public List and Detail

- [x] 4.1 Add typed API calls for `GET /workshops` and `GET /workshops/:id` in the workshop API client used by public pages.
- [x] 4.2 Add a mandatory workshop detail route.
- [x] 4.3 Add navigation from each workshop list item to its detail page.
- [x] 4.4 Display room map URL or uploaded room map asset, AI summary, schedule, price, status, and available slots on detail.
- [x] 4.5 Poll `GET /workshops` every 10 seconds on the public workshop list while the tab is visible.
- [x] 4.6 Pause polling when `document.visibilityState` is hidden and refresh immediately when visible again.
- [x] 4.7 Keep the last successful list data and show a non-blocking warning when a polling request fails.
- [x] 4.8 Keep registration actions disabled when a workshop is not open or has no slots.

## 5. Verification

- [x] 5.1 Build the backend.
- [x] 5.2 Build the frontend.
- [ ] 5.3 Manually verify organizer cannot mutate workshops as `STUDENT` or without a token.
- [x] 5.4 Manually verify create, edit, publish, cancel, and complete status flows.
- [ ] 5.5 Verify Redis slot counter is created on workshop create and updated on capacity edit.
- [x] 5.6 Verify valid room map files upload, return `roomMapUrl`, persist on the workshop, and render on admin and detail pages.
- [x] 5.7 Verify invalid room map type and oversized room map upload return HTTP 400 and do not change `roomMapUrl`.
- [x] 5.8 Verify public workshop list polls every 10 seconds while visible and updates slot counts from Redis-backed `GET /workshops`.
- [ ] 5.9 Verify public workshop list pauses polling while hidden and refreshes when visible again.
- [ ] 5.10 Verify polling failures keep the last successful list data visible with a non-blocking warning.
- [x] 5.11 Verify list-to-detail navigation and direct detail URL loading.
- [ ] 5.12 Verify public workshop list/detail still load when payment or AI summary dependencies are unavailable.
