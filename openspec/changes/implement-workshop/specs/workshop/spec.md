## MODIFIED Requirements

### Requirement: Browse workshops
The system SHALL allow guests and students to browse open workshops with available slots read from Redis.

#### Scenario: List workshops
- GIVEN a guest or student opens the workshop list
- WHEN the frontend calls `GET /workshops`
- THEN the backend returns open workshop data from PostgreSQL
- AND enriches each workshop with available slot count from Redis

#### Scenario: Redis slot counter missing during list
- GIVEN an open workshop exists in PostgreSQL
- AND its Redis slot counter is missing
- WHEN the backend handles `GET /workshops`
- THEN the backend initializes `workshop:{id}:slots` from canonical `slotLeft` using `SET NX`
- AND returns the workshop with the initialized slot count

#### Scenario: Workshop list polls slot counts
- GIVEN a student is viewing the workshop list in a visible browser tab
- WHEN 10 seconds pass after the last successful refresh
- THEN the frontend calls `GET /workshops` again
- AND updates displayed `slotLeft` values from the response

#### Scenario: Workshop list polling pauses while hidden
- GIVEN the workshop list page is open
- WHEN the browser tab becomes hidden
- THEN the frontend pauses polling
- AND resumes polling immediately when the tab becomes visible again

#### Scenario: Workshop list polling fails
- GIVEN the workshop list has previously loaded successfully
- WHEN a polling request fails
- THEN the frontend keeps the last successful workshop data visible
- AND shows a non-blocking refresh warning

### Requirement: View workshop details
The system SHALL return detailed workshop information for a visible workshop.

#### Scenario: Workshop detail
- GIVEN a user opens a workshop detail page
- WHEN the frontend calls `GET /workshops/:id`
- THEN the backend returns workshop content, room map, AI summary, schedule, price, status, and slot count
- AND the slot count is read from Redis when available

#### Scenario: Navigate from list to detail
- GIVEN a student is viewing the workshop list
- WHEN the student selects a workshop
- THEN the frontend navigates to that workshop's detail page
- AND loads the detail data from `GET /workshops/:id`

#### Scenario: Unknown workshop detail
- GIVEN no workshop exists for the requested ID
- WHEN the frontend calls `GET /workshops/:id`
- THEN the backend returns HTTP 404 Not Found

### Requirement: Organizer workshop management
The system SHALL allow only organizers to create, update, publish, complete, or cancel workshops.

#### Scenario: Organizer creates workshop
- GIVEN an `ORGANIZER` submits valid workshop data
- WHEN the backend handles `POST /workshops`
- THEN the system creates a PostgreSQL record
- AND initializes the Redis slot counter with the available seats
- AND returns the created workshop

#### Scenario: Organizer updates workshop
- GIVEN an `ORGANIZER` submits valid changes for an existing workshop
- WHEN the backend handles `PATCH /workshops/:id`
- THEN the system updates the PostgreSQL record
- AND recomputes the Redis slot counter if capacity changed

#### Scenario: Organizer uploads room map
- GIVEN an `ORGANIZER` selects a valid PNG, JPEG, WebP, SVG, or PDF room map file no larger than 5 MB
- WHEN the backend handles `POST /workshops/:id/room-map`
- THEN the backend stores the file in the room map upload location
- AND updates the workshop `roomMapUrl`
- AND returns the persisted `roomMapUrl`

#### Scenario: Organizer uploads invalid room map
- GIVEN an `ORGANIZER` selects an unsupported or oversized room map file
- WHEN the backend handles `POST /workshops/:id/room-map`
- THEN the backend returns HTTP 400 Bad Request
- AND does not update the workshop `roomMapUrl`

#### Scenario: Organizer saves room map URL in form
- GIVEN an `ORGANIZER` enters a valid room map URL instead of uploading a file
- WHEN the backend handles `POST /workshops` or `PATCH /workshops/:id`
- THEN the system stores the URL in `roomMapUrl`

#### Scenario: Organizer changes workshop status
- GIVEN an `ORGANIZER` requests a valid status transition
- WHEN the backend handles `PATCH /workshops/:id/status`
- THEN the system stores the new status
- AND keeps the workshop record for audit and downstream references

#### Scenario: Student attempts mutation
- GIVEN a `STUDENT` calls a workshop mutation endpoint
- WHEN guards evaluate the request
- THEN the backend returns HTTP 403 Forbidden

#### Scenario: Capacity reduced below registrations
- GIVEN a workshop has active registrations
- WHEN an `ORGANIZER` attempts to set `totalSlots` below the active registration count
- THEN the backend returns HTTP 400 Bad Request
- AND does not update PostgreSQL or Redis capacity values

## ADDED Constraints

- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Available slot display MUST read from Redis, not SQL count queries.
- Mutating workshop operations MUST require role `ORGANIZER`.
- Delete or cancel operations MUST use soft delete or status flags, not hard delete.
- Capacity updates MUST reject values below the active registration count.
- Room map upload MUST require role `ORGANIZER`.
- Room map upload MUST accept only PNG, JPEG, WebP, SVG, or PDF files up to 5 MB.
- The public workshop list MUST poll `GET /workshops` every 10 seconds while the tab is visible.
- The workshop detail page MUST be reachable from the public workshop list.
