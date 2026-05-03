## MODIFIED Requirements

### Requirement: JWT login
The system SHALL authenticate users through `POST /auth/login` using email and password stored for an existing user, and the frontend SHALL provide a user-facing login flow for that endpoint.

#### Scenario: Valid credentials
- GIVEN a persisted user has an email, password credential, and role
- WHEN the user submits the matching email and password to `POST /auth/login`
- THEN the backend validates the password credential
- AND returns a signed JWT containing `id`, `email`, and `role`
- AND returns the authenticated user profile without the password credential

#### Scenario: Invalid credentials
- GIVEN a user submits an unknown email or incorrect password
- WHEN the backend validates the login request
- THEN the backend returns HTTP 401 Unauthorized
- AND no token is issued

#### Scenario: Frontend login success
- GIVEN a user enters valid email and password in the login page
- WHEN the frontend submits the credentials to `POST /auth/login`
- THEN the frontend stores the returned JWT and authenticated user
- AND redirects the user to the appropriate role area

#### Scenario: Frontend login failure
- GIVEN a user enters invalid credentials in the login page
- WHEN the frontend receives HTTP 401 Unauthorized
- THEN the frontend shows an authentication error
- AND does not store a JWT

### Requirement: Role-based access control
The system SHALL protect secured endpoints with JWT and role guards, and the frontend SHALL prevent users from entering role-scoped areas they cannot access.

#### Scenario: Protected request with valid role
- GIVEN a user has a valid JWT with the required role
- WHEN the user calls a protected endpoint or opens a matching protected route
- THEN the request or route is allowed

#### Scenario: Protected request with wrong role
- GIVEN a `STUDENT` calls an `ORGANIZER` endpoint or opens an organizer-only route
- WHEN the guards or frontend route checks evaluate the request
- THEN the backend returns HTTP 403 Forbidden for API access
- AND the frontend blocks or redirects the user without rendering protected content

### Requirement: Token validation
The system SHALL reject missing, expired, malformed, or unverifiable JWTs on protected endpoints, and the frontend SHALL clear invalid local auth state.

#### Scenario: Missing or invalid token
- GIVEN a request has no bearer token, an expired token, or a token signed with a different secret
- WHEN the request reaches a protected endpoint
- THEN the backend returns HTTP 401 Unauthorized

#### Scenario: Valid token maps to user context
- GIVEN a request includes a valid JWT containing `id`, `email`, and `role`
- WHEN the request reaches a protected endpoint
- THEN the backend attaches the authenticated user context to the request
- AND controllers can read the caller through `@CurrentUser()`

#### Scenario: Frontend receives unauthorized response
- GIVEN the frontend has a missing, expired, malformed, or unverifiable token
- WHEN a protected API call returns HTTP 401 Unauthorized
- THEN the frontend clears the stored JWT and authenticated user
- AND sends the user back to login for protected views

## ADDED Constraints

- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
