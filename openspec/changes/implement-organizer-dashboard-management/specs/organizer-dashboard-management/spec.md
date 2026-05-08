# organizer-dashboard-management Specification

## ADDED Requirements

### Requirement: Organizer can view dashboard overview stats

The system SHALL allow an authenticated organizer to retrieve dashboard overview stats from `GET /api/stats/overview`.

The endpoint SHALL be ORGANIZER only.

The endpoint SHALL return aggregate counts for users, workshops, registrations, and capacity based on the current database schema.

The endpoint SHALL be read-only.

The endpoint SHALL NOT include payment analytics, revenue analytics, check-in analytics, or unsupported analytics fields.

#### Scenario: Organizer views overview stats

- GIVEN an authenticated user with role `ORGANIZER`
- WHEN they request `GET /api/stats/overview`
- THEN the system returns users, workshops, registrations, and capacity aggregates

#### Scenario: Unauthenticated request rejected

- GIVEN a request without a valid JWT
- WHEN the request calls `GET /api/stats/overview`
- THEN the system rejects the request with HTTP 401 Unauthorized

#### Scenario: Non-organizer request rejected

- GIVEN an authenticated user without role `ORGANIZER`
- WHEN the request calls `GET /api/stats/overview`
- THEN the system rejects the request with HTTP 403 Forbidden

#### Scenario: Endpoint does not mutate data

- GIVEN an authenticated organizer requests overview stats
- WHEN the system calculates the response
- THEN the endpoint MUST NOT mutate users, workshops, registrations, payments, check-in data, auth data, or sync data

### Requirement: Organizer can view dashboard charts

The system SHALL provide an organizer dashboard UI that consumes `/api/stats/overview`.

The dashboard UI SHALL display summary cards and charts for users by role, workshops by status, registrations by status, and capacity usage.

The dashboard UI SHALL handle loading, error, and empty states.

The dashboard UI SHALL remain usable on mobile viewports.

#### Scenario: Organizer opens dashboard and sees stats cards/charts

- GIVEN an authenticated organizer
- AND the stats API returns overview data
- WHEN the organizer opens the dashboard
- THEN the UI displays summary cards and charts for users, workshops, registrations, and capacity

#### Scenario: Stats API loading state is shown

- GIVEN an authenticated organizer opens the dashboard
- WHEN the stats API request is pending
- THEN the UI shows a loading state

#### Scenario: Stats API error state is shown

- GIVEN an authenticated organizer opens the dashboard
- WHEN the stats API request fails
- THEN the UI shows an error state

#### Scenario: Dashboard remains usable on mobile

- GIVEN an authenticated organizer uses a mobile viewport
- WHEN they open the dashboard
- THEN the cards and charts remain readable and usable

### Requirement: Organizer can list and search student users

The system SHALL allow an authenticated organizer to retrieve a paginated list of student users from `GET /api/students`.

The endpoint SHALL be ORGANIZER only.

The endpoint SHALL support `page`, `limit`, and `search` query params.

The endpoint SHALL return only users where `role = STUDENT`.

The endpoint SHALL return only safe response fields: `id`, `email`, `name`, `studentId`, `role`, and `createdAt`.

The endpoint SHALL NOT return `updatedAt` unless the current Prisma `User` schema has it.

The endpoint SHALL NOT return sensitive auth fields including `passwordHash`, token hashes, refresh tokens, or auth secrets.

#### Scenario: Organizer lists students

- GIVEN an authenticated user with role `ORGANIZER`
- WHEN they request `GET /api/students`
- THEN the system returns paginated users where `role = STUDENT`
- AND the response includes pagination metadata

#### Scenario: Organizer searches students

- GIVEN an authenticated user with role `ORGANIZER`
- AND a search query is provided
- WHEN they request `GET /api/students?search=...`
- THEN the system filters student users by `name`, `email`, or `studentId`

#### Scenario: Pagination metadata returned

- GIVEN an authenticated user with role `ORGANIZER`
- WHEN they request `GET /api/students?page=2&limit=20`
- THEN the response includes `page`, `limit`, `total`, and `totalPages`

#### Scenario: Unauthenticated request rejected

- GIVEN a request without a valid JWT
- WHEN the request calls `GET /api/students`
- THEN the system rejects the request with HTTP 401 Unauthorized

#### Scenario: Non-organizer request rejected

- GIVEN an authenticated user without role `ORGANIZER`
- WHEN the request calls `GET /api/students`
- THEN the system rejects the request with HTTP 403 Forbidden

#### Scenario: Sensitive fields excluded

- GIVEN student users exist with authentication-related fields
- WHEN an organizer lists students
- THEN the response MUST NOT include `passwordHash`, token hashes, refresh tokens, auth secrets, or other sensitive auth fields

### Requirement: Organizer can view student detail

The system SHALL allow an authenticated organizer to view safe details for one student user from `GET /api/students/:id`.

The endpoint SHALL be ORGANIZER only.

The endpoint SHALL return only safe student fields: `id`, `email`, `name`, `studentId`, `role`, and `createdAt`.

The endpoint SHALL return HTTP 404 for an unknown student id.

The endpoint SHALL return HTTP 404 for an id that belongs to a non-`STUDENT` user.

The endpoint SHALL NOT return sensitive auth fields including `passwordHash`, token hashes, refresh tokens, or auth secrets.

The endpoint SHALL NOT include `registrationSummary` in this change.

#### Scenario: Organizer views valid student detail

- GIVEN a valid student id
- AND an authenticated user with role `ORGANIZER`
- WHEN they request `GET /api/students/:id`
- THEN the system returns safe details for that student

#### Scenario: Unknown id returns 404

- GIVEN no user exists for the provided id
- WHEN an organizer requests `GET /api/students/:id`
- THEN the system returns HTTP 404 Not Found

#### Scenario: Non-student id returns 404

- GIVEN the provided id belongs to a user whose role is not `STUDENT`
- WHEN an organizer requests `GET /api/students/:id`
- THEN the system returns HTTP 404 Not Found

#### Scenario: Sensitive fields excluded

- GIVEN the student has authentication-related fields
- WHEN an organizer views student detail
- THEN the response MUST NOT include `passwordHash`, token hashes, refresh tokens, auth secrets, or other sensitive auth fields

### Requirement: Organizer can use student management UI

The system SHALL provide an organizer student management UI that consumes `/api/students`.

The UI SHALL show a student list, table, or responsive cards.

The UI SHALL support search.

The UI SHALL support pagination.

The UI MAY open student detail if implemented.

The UI SHALL handle loading, error, and empty states.

The UI SHALL remain usable on mobile viewports.

The UI SHALL NOT expose sensitive auth fields.

#### Scenario: Organizer opens student management page

- GIVEN an authenticated organizer
- AND the students API returns data
- WHEN the organizer opens the student management page
- THEN the UI displays student users using safe fields only

#### Scenario: Organizer searches students

- GIVEN an authenticated organizer is on the student management page
- WHEN they enter a search term
- THEN the UI requests matching students and displays the results

#### Scenario: Organizer changes page

- GIVEN an authenticated organizer is viewing a paginated student list
- WHEN they change page
- THEN the UI requests and displays the selected page of students

#### Scenario: Empty state shown when no students match

- GIVEN an authenticated organizer searches students
- WHEN no students match the search
- THEN the UI shows an empty state

#### Scenario: Error state shown when API fails

- GIVEN an authenticated organizer opens the student management page
- WHEN the students API request fails
- THEN the UI shows an error state

#### Scenario: UI remains usable on mobile

- GIVEN an authenticated organizer uses a mobile viewport
- WHEN they open the student management page
- THEN the list, search, pagination, and optional detail view remain readable and usable
