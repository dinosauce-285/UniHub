# Workshop Administration Specification

## Purpose
Define how workshops are browsed, viewed, created, updated, and canceled while keeping slot display fast through Redis.

## Requirements

### Requirement: Browse workshops
The system SHALL allow guests and students to browse workshops.

#### Scenario: List workshops
- GIVEN a guest or student opens the workshop list
- WHEN the frontend calls `GET /workshops`
- THEN the backend returns workshop data from PostgreSQL
- AND enriches each workshop with available slot count from Redis

### Requirement: View workshop details
The system SHALL return detailed workshop information.

#### Scenario: Workshop detail
- GIVEN a user opens a workshop detail page
- WHEN the frontend calls `GET /workshops/:id`
- THEN the backend returns workshop content, room map, AI summary, and slot count

### Requirement: Organizer workshop management
The system SHALL allow only organizers to create, update, delete, or cancel workshops.

#### Scenario: Organizer creates workshop
- GIVEN an `ORGANIZER` submits valid workshop data
- WHEN the backend handles `POST /workshops`
- THEN the system creates a PostgreSQL record
- AND initializes the Redis slot counter with total seats

#### Scenario: Student attempts mutation
- GIVEN a `STUDENT` calls `POST /workshops`
- WHEN guards evaluate the request
- THEN the backend returns HTTP 403 Forbidden

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Available slot display MUST read from Redis, not SQL count queries.
- Mutating workshop operations MUST require role `ORGANIZER`.
- Delete or cancel operations MUST use soft delete or status flags, not hard delete.
