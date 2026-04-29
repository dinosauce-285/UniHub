# Auth Spec

## Description

JWT-based authentication with three fixed roles: `STUDENT`, `ORGANIZER`, `CHECKIN_STAFF`.

## Main flow

1. User submits login credentials.
2. Backend validates identity and issues JWT.
3. Frontend stores token and sends it on protected requests.
4. RBAC guard checks role metadata on protected endpoints.

## Error scenarios

- Invalid credentials
- Expired or malformed JWT
- Access denied due to missing role

## Constraints

- Token secret must come from environment configuration
- Every protected endpoint must document required roles

## Acceptance criteria

- Users can obtain a JWT and call protected endpoints according to role
- Unauthorized or forbidden requests return correct HTTP status

