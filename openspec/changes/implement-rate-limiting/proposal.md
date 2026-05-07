## Why

UniHub must absorb burst traffic when registration opens without letting repeated requests overload the API or starve normal workshop browsing. The Blueprint calls out 12,000 students in the first 10 minutes, with a heavy burst in the first 3 minutes, so uncontrolled retries and button spam can waste backend capacity before registration slot protection even runs.

The existing rate-limiting spec is the source of truth for this change: Redis-backed token bucket rate limiting, HTTP 429 responses with `Retry-After`, endpoint-specific limits, and frontend-facing feedback for throttled requests.

## What Changes

- Add backend rate limiting as a global NestJS guard backed by Redis token bucket state.
- Add route-specific throttling overrides for sensitive registration writes and read-heavy workshop browsing.
- Ensure every throttled response returns HTTP 429 with a `Retry-After` header.
- Use Redis so horizontally scaled backend nodes share token state.
- Preserve existing JWT/RBAC behavior and registration idempotency; throttling runs before expensive endpoint work.
- Update frontend API error handling and relevant user-facing flows to recognize HTTP 429 and show a retry message using `Retry-After` when available.

In scope:
- Backend API/business logic rate limiting in `server/`.
- Redis-backed token storage and fail-closed behavior for protected API traffic.
- Frontend handling for 429 responses in existing registration and workshop browsing flows.
- Manual and build verification for global, route-specific, and frontend error behavior.

Out of scope:
- New infrastructure beyond the existing Redis dependency.
- Monitoring dashboards, production alerting, or external WAF/CDN rules.
- Changing registration slot claiming, idempotency, payment, check-in, CSV import, or AI summary behavior.
- Splitting rate limiting into smaller specs.

Key risks:
- Redis outages can affect request admission; the implementation must return controlled 429/503-style errors rather than hanging.
- Incorrect tracker selection could apply registration limits per IP instead of per authenticated user, weakening spam protection.
- Missing `Retry-After` would violate the spec and make frontend retry guidance unreliable.
- Overly broad limits could throttle organizer/admin workflows unintentionally.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `rate-limiting`: Implement Redis-backed token bucket throttling globally with route-specific overrides for registration writes and workshop reads.

## Impact

- Backend modules: `server/src/app.module.ts`, a new rate limiting module under `server/src/core/rate-limiting`, `server/src/core/redis`, `server/src/modules/registration`, `server/src/modules/workshop`.
- Frontend modules: `client/src/lib/api.ts`, `client/src/utils/errors.ts`, student registration and workshop browsing surfaces that display API errors.
- Database: No schema changes.
- Configuration: Uses existing `REDIS_URL`; adds documented rate-limit constants or environment overrides for global, registration, and workshop-read policies.
- APIs:
  - Global API requests are throttled by IP or authenticated user tracker as appropriate.
  - `POST /api/registrations` rejects more than 10 requests in 10 seconds for the same authenticated student.
  - `GET /api/workshops` and `GET /api/workshops/:id` allow normal browsing below 100 requests per minute.
  - All throttled requests return HTTP 429 with `Retry-After`.
