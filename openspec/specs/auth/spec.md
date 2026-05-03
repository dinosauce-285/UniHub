# Auth and RBAC Specification

## Purpose
Define how UniHub authenticates users with JWT and enforces access through fixed roles.

## Requirements

### Requirement: JWT login
The system SHALL authenticate users through `POST /auth/login` using email and password.

#### Scenario: Valid credentials
- GIVEN a user submits valid email and password
- WHEN the backend validates the account
- THEN the backend returns a JWT containing `id`, `email`, and `role`

#### Scenario: Invalid credentials
- GIVEN a user submits invalid credentials
- WHEN the backend validates the login request
- THEN the backend returns HTTP 401 Unauthorized
- AND no token is issued

### Requirement: Role-based access control
The system SHALL protect secured endpoints with JWT and role guards.

#### Scenario: Protected request with valid role
- GIVEN a user has a valid JWT with the required role
- WHEN the user calls a protected endpoint
- THEN the request is allowed

#### Scenario: Protected request with wrong role
- GIVEN a `STUDENT` calls an `ORGANIZER` endpoint
- WHEN the guards evaluate the request
- THEN the backend returns HTTP 403 Forbidden

### Requirement: Token validation
The system SHALL reject missing, expired, or malformed JWTs on protected endpoints.

#### Scenario: Missing or invalid token
- GIVEN a request has no token or an invalid token
- WHEN the request reaches a protected endpoint
- THEN the backend returns HTTP 401 Unauthorized

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- JWT secret MUST come from environment variables.
- Secured endpoints MUST use `@Roles()`.
- Refresh tokens are out of scope for this version.
