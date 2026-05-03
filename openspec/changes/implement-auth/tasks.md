## 1. Backend Auth

- [x] 1.1 Add `passwordHash` to `User` in Prisma schema and create/apply the migration or local schema push path used by the project.
- [x] 1.2 Add password hash helpers using Node `crypto` with salted one-way hashes.
- [x] 1.3 Update seed data so students, organizers, and check-in staff receive repeatable demo credentials.
- [x] 1.4 Create `LoginDto` with validated `email` and `password` fields.
- [x] 1.5 Implement `AuthService` to find users, verify passwords, return safe user profiles, and sign JWT access tokens.
- [x] 1.6 Update `AuthModule` to configure Passport JWT and `JwtModule` from environment variables.
- [x] 1.7 Replace the `AuthController` stub with real `POST /auth/login` behavior.

## 2. Guards and User Context

- [x] 2.1 Add `JwtStrategy` that validates bearer tokens and exposes `{ id, email, role }`.
- [x] 2.2 Add reusable `JwtAuthGuard`.
- [x] 2.3 Add `@CurrentUser()` decorator.
- [x] 2.4 Review secured controllers and apply `JwtAuthGuard` plus `@Roles()` where role-scoped access is required.
- [x] 2.5 Ensure `RolesGuard` returns HTTP 403 only after JWT auth has populated `request.user`.

## 3. Configuration and Docs

- [x] 3.1 Add `JWT_SECRET` and optional `JWT_EXPIRES_IN` to `.env.example`.
- [x] 3.2 Document local demo credentials in README or getting-started docs.

## 4. Frontend Auth

- [x] 4.1 Check `client/src/components` for reusable form, button, field, card, and feedback components before creating auth UI pieces.
- [x] 4.2 Use theme tokens from `client/src/index.css` and `client/tailwind.config.ts` for all auth UI styling.
- [x] 4.3 Create missing shared auth UI components only when no suitable reusable component exists.
- [x] 4.4 Add typed auth API calls for `POST /auth/login`.
- [x] 4.5 Add auth state/hook to store `accessToken` and authenticated user, persist across refresh, and clear on logout.
- [x] 4.6 Update the shared API client to attach the JWT and clear auth state on HTTP 401.
- [x] 4.7 Add a login page with email/password validation, loading state, and invalid credential feedback.
- [x] 4.8 Add protected route behavior for unauthenticated users.
- [x] 4.9 Add role-aware route behavior for `STUDENT`, `ORGANIZER`, and `CHECKIN_STAFF` areas.
- [x] 4.10 Keep the frontend free of placeholder/mock scaffold UI while implementing real auth screens.

## 5. Verification

- [ ] 5.1 Run Prisma generation and seed against local Docker services.
- [x] 5.2 Build the backend.
- [x] 5.3 Build the frontend.
- [ ] 5.4 Manually verify valid login, invalid login, missing token, wrong role, and valid role backend scenarios.
- [ ] 5.5 Manually verify frontend login, token persistence, protected route redirect, role mismatch handling, and logout.
