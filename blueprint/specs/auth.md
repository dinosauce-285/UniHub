# Specification: Authentication & RBAC

## Description
Authentication uses JWT and a Role-Based Access Control system for UniHub Workshop. The system defines three fixed role groups: `STUDENT`, `ORGANIZER`, and `CHECKIN_STAFF`.

## Main Flow
1. The user sends login credentials (email, password) to `POST /auth/login`.
2. The backend validates the account.
3. If valid, the backend issues a JWT containing `id`, `email`, and `role`.
4. The frontend stores the token and automatically attaches it to the `Authorization: Bearer <token>` header on every following request.
5. NestJS Guards (`JwtAuthGuard` and `RolesGuard`) validate the token and role at each endpoint before allowing processing.

## Error Scenarios
- **Invalid credentials**: Return HTTP 401 Unauthorized and do not issue a token.
- **Expired or malformed token**: Return HTTP 401 Unauthorized when accessing a protected endpoint.
- **Insufficient authority**: A `STUDENT` attempts to call an `ORGANIZER` API -> return HTTP 403 Forbidden.

## Constraints
- The JWT secret key must be read from an environment variable and must not be hardcoded.
- Every secured endpoint must be marked with the `@Roles()` decorator.
- Refresh Token support is outside the scope of this version.

## Acceptance Criteria
- A user who logs in successfully receives a JWT and can use it to call APIs.
- Requests with a missing or invalid token are rejected with status 401.
- Requests using the wrong role are rejected with status 403.
