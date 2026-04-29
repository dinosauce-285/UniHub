# Auth Specification

## Purpose
JWT-based authentication and role-based access control for UniHub Workshop.
Three fixed roles: STUDENT, ORGANIZER, CHECKIN_STAFF.

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT access token upon successful login with valid credentials.

#### Scenario: Valid credentials
- GIVEN a registered user with valid email and password
- WHEN the user submits login credentials to `POST /auth/login`
- THEN a signed JWT access token is returned
- AND the token contains the user's id, email, and role

#### Scenario: Invalid credentials
- GIVEN invalid email or password
- WHEN the user submits login credentials
- THEN HTTP 401 is returned
- AND no token is issued

#### Scenario: Malformed or expired JWT
- GIVEN a request with an expired or malformed Authorization header
- WHEN the request reaches a protected endpoint
- THEN HTTP 401 is returned

### Requirement: Role-Based Access Control
The system SHALL restrict endpoint access based on the authenticated user's role.

#### Scenario: Authorized role
- GIVEN a user with role ORGANIZER
- WHEN the user calls `POST /workshops`
- THEN the request is processed normally

#### Scenario: Unauthorized role
- GIVEN a user with role STUDENT
- WHEN the user calls `POST /workshops`
- THEN HTTP 403 Forbidden is returned

#### Scenario: Unauthenticated request
- GIVEN a request with no Authorization header
- WHEN the request reaches a protected endpoint
- THEN HTTP 401 is returned

### Requirement: Role Mapping
The system SHALL enforce the following permission boundaries:
- STUDENT: read workshops, register, view own QR
- ORGANIZER: full CRUD on workshops, view statistics and user lists
- CHECKIN_STAFF: access QR scan and check-in endpoints only

## Constraints
- JWT secret MUST come from environment variable; never hardcoded
- All protected endpoints MUST declare required roles via `@Roles()` decorator
- Refresh token flow is out of scope for v1

## Acceptance Criteria
- Users can obtain a JWT via `POST /auth/login` and use it on protected endpoints
- Requests with wrong role receive HTTP 403
- Requests with no/invalid token receive HTTP 401
