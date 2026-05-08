## 1. Spec Review

- [x] 1.1 Review this OpenSpec change before implementation.
- [x] 1.2 Confirm the scope remains bounded to organizer dashboard and student management.
- [x] 1.3 Confirm no files under `openspec/specs/` need edits for this change.
- [x] 1.4 Confirm `blueprint/` remains unchanged.

## 2. Backend API

- [x] 2.1 Extend `server/src/modules/students` with `GET /api/students`.
- [x] 2.2 Extend `server/src/modules/students` with `GET /api/students/:id`.
- [x] 2.3 Add `server/src/modules/stats` with `StatsModule`.
- [x] 2.4 Add `GET /api/stats/overview`.
- [x] 2.5 Register `StatsModule` in `AppModule`.
- [x] 2.6 Add DTO validation for student list query params.
- [x] 2.7 Use safe Prisma selects for student list/detail responses.
- [x] 2.8 Use the existing ORGANIZER guard/RBAC pattern for all new endpoints.
- [x] 2.9 Keep endpoints read-only and avoid user create/update/delete APIs.

## 3. Frontend API Client/Types

- [x] 3.1 Add stats API helper for `/api/stats/overview`.
- [x] 3.2 Add students API helper for `/api/students`.
- [x] 3.3 Add student detail API helper for `/api/students/:id` if the UI includes detail.
- [x] 3.4 Add or update TypeScript types for overview stats, student list, pagination meta, and safe student detail.
- [x] 3.5 Ensure frontend types do not include sensitive user fields.

## 4. Organizer Dashboard UI

- [x] 4.1 Add or update organizer dashboard cards for total users/students, workshops, registrations, and capacity usage.
- [x] 4.2 Add dashboard charts for users by role.
- [x] 4.3 Add dashboard charts for workshops by status.
- [x] 4.4 Add dashboard charts for registrations by status.
- [x] 4.5 Add dashboard chart or visual treatment for capacity usage.
- [x] 4.6 Consume `/api/stats/overview` through the stats API helper.
- [x] 4.7 Add loading, error, and empty states.
- [x] 4.8 Ensure the dashboard is mobile responsive and consistent with the existing UI style.

## 5. Student Management UI

- [x] 5.1 Add or update organizer student management route/page.
- [x] 5.2 Add search input for student `name`, `email`, or `studentId`.
- [x] 5.3 Add paginated student table/list.
- [x] 5.4 Consume `/api/students` through the students API helper.
- [x] 5.5 Add student detail view/modal/page using `/api/students/:id` if included.
- [x] 5.6 Show only safe fields: `id`, `email`, `name`, `studentId`, `role`, and `createdAt`.
- [x] 5.7 Add loading, error, and empty states.
- [x] 5.8 Ensure student management is mobile responsive and consistent with the existing UI style.

## 6. Auth/RBAC Verification

- [x] 6.1 Verify all backend endpoints require authentication.
- [x] 6.2 Verify all backend endpoints require `ORGANIZER`.
- [x] 6.3 Verify frontend organizer dashboard route is organizer-only.
- [x] 6.4 Verify frontend student management route is organizer-only.
- [ ] 6.5 Verify non-organizer users cannot access the new API or UI surfaces.

## 7. Build/Test

- [x] 7.1 Run backend build.
- [x] 7.2 Run frontend build.
- [ ] 7.3 Add or update focused backend tests if the repository has an established pattern.
- [ ] 7.4 Add or update focused frontend tests if the repository has an established pattern.
- [x] 7.5 Verify no new dependencies were added.

## 8. Manual Verification

- [ ] 8.1 Verify organizer dashboard renders cards/charts from `/api/stats/overview`.
- [ ] 8.2 Verify organizer student management lists students from `/api/students`.
- [ ] 8.3 Verify search filters by student `name`, `email`, or `studentId`.
- [ ] 8.4 Verify pagination metadata and page changes work.
- [ ] 8.5 Verify loading, empty, and error states for both UI areas.
- [ ] 8.6 Verify mobile layouts remain usable.
- [ ] 8.7 Verify sensitive fields are absent from all student responses and UI views.

## 9. Documentation Review

- [x] 9.1 Confirm this change uses `organizer-dashboard-management` as the capability name.
- [x] 9.2 Confirm proposal, design, tasks, and spec agree on scope.
- [x] 9.3 Confirm no existing files under `openspec/specs/` were edited.
- [x] 9.4 Confirm `blueprint/` was not edited.
- [ ] 9.5 Confirm no application code was implemented during this OpenSpec rewrite.
