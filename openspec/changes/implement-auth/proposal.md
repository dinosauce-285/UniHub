## Why

`POST /auth/login` currently returns a hard-coded `dev-token`, so protected UniHub flows cannot reliably identify the caller or enforce the 3 fixed roles. Implementing real JWT authentication now unblocks workshop admin, registration, and check-in endpoints that depend on `request.user` and `@Roles()`.

Without this change, any client can appear logged in and role checks either fail unpredictably or depend on mocked state, which is unsafe for the 12,000-student registration target and staff/admin workflows.

## What Changes

- Replace the auth controller stub with email/password login backed by Prisma `User` records.
- Add password credential storage for seeded users and future CSV/admin-created users.
- Issue signed JWT access tokens containing `id`, `email`, and `role`.
- Add Passport JWT strategy plus a reusable `JwtAuthGuard`.
- Keep `RolesGuard` behavior and make it evaluate the authenticated JWT user payload.
- Protect role-scoped backend endpoints with `JwtAuthGuard` and `@Roles()` where those endpoints already require authorization.
- Add a `@CurrentUser()` decorator for controllers that need the authenticated caller.
- Add frontend auth state, login UI, logout behavior, JWT persistence, and protected role-aware routes.
- Ensure frontend auth screens first reuse `client/src/components`, follow `client/src/index.css` and `client/tailwind.config.ts`, and create shared components only when needed.
- Add manual verification steps for valid login, invalid login, missing token, wrong role, and valid role.

In scope:
- Backend auth implementation in NestJS.
- Frontend auth implementation in React.
- Prisma schema/seed updates needed for demo credentials.
- Environment-driven JWT secret and expiration configuration.

Out of scope:
- Refresh tokens and token rotation.
- Password reset, account registration, email verification, or MFA.
- Production identity-provider integration.

Key risks:
- Existing seed data lacks passwords, so migrations/seeding must be handled carefully for repeatable local setup.
- Role protection may expose endpoints that were relying on mock auth during parallel feature work.
- Weak JWT secret defaults would undermine local testing expectations, so startup config must fail or use explicit dev-only behavior.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `auth`: Clarify that JWT login validates a stored password credential and that token payloads are derived from persisted user records.

## Impact

- Backend modules: `server/src/modules/auth`, `server/src/common/guards`, `server/src/common/decorators`, and secured controllers.
- Frontend modules: `client/src/lib/api.ts`, auth state/hook files, login page, protected route component, and role-scoped route wiring.
- Database: add a password credential field to `User` and update Prisma seed data with demo passwords.
- Configuration: require `JWT_SECRET` and support JWT expiration configuration.
- Dependencies: use already-installed `@nestjs/jwt`, `@nestjs/passport`, `passport`, and `passport-jwt`; avoid adding refresh-token storage.
- APIs: `POST /auth/login` continues returning JSON, but now returns a real signed token and rejects invalid credentials with HTTP 401.
