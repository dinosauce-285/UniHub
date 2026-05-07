## 1. Backend Dependencies and Configuration

- [x] 1.1 Add NestJS throttling dependency or equivalent internal guard support compatible with NestJS 11.
- [x] 1.2 Create `server/src/core/rate-limiting` module files.
- [x] 1.3 Define rate-limit policy constants for global, registration-write, and workshop-read limits.
- [x] 1.4 Wire `RateLimitingModule` into `AppModule` using the existing `RedisModule`.
- [x] 1.5 Document or expose environment overrides only where they do not weaken the required registration and workshop-read limits.

## 2. Redis Token Bucket Storage

- [x] 2.1 Implement Redis-backed token bucket storage using `RedisService.getClient()`.
- [x] 2.2 Ensure token consume/refill logic is atomic with Lua or a proven Redis throttler storage implementation.
- [x] 2.3 Store token keys with policy-specific prefixes to prevent cross-policy budget collisions.
- [x] 2.4 Set key expirations so inactive clients do not leave permanent Redis keys.
- [x] 2.5 Handle Redis errors predictably with bounded timeouts and explicit API errors.

## 3. Backend Guard Behavior

- [x] 3.1 Register rate limiting as a global guard.
- [x] 3.2 Resolve tracker keys from authenticated JWT user ID when available, falling back to client IP for anonymous requests.
- [x] 3.3 Apply the registration-write policy to `POST /registrations`.
- [x] 3.4 Apply the workshop-read policy to `GET /workshops` and `GET /workshops/:id`.
- [x] 3.5 Preserve existing `JwtAuthGuard`, `RolesGuard`, idempotency, and registration slot-claiming behavior.
- [x] 3.6 Ensure throttled responses return HTTP 429.
- [x] 3.7 Ensure every 429 includes a valid `Retry-After` header.
- [ ] 3.8 Add focused backend tests or a local verification script for under-limit and over-limit cases.

## 4. Frontend User-Facing Flow

- [x] 4.1 Extend shared API error utilities to detect HTTP 429.
- [x] 4.2 Read and format the `Retry-After` response header for user-facing messages.
- [x] 4.3 Update registration error handling so throttled registration attempts show retry guidance.
- [x] 4.4 Update workshop browsing or polling error handling so throttled read requests keep prior data visible.
- [x] 4.5 Reuse existing components and styling; create no new shared component unless an existing one cannot cover the message state.

## 5. Verification

- [x] 5.1 Run backend build.
- [x] 5.2 Run frontend build.
- [x] 5.3 Verify a request under the active limit reaches the endpoint and consumes one token.
- [ ] 5.4 Verify `POST /api/registrations` rejects the 11th request within 10 seconds with HTTP 429.
- [x] 5.5 Verify `GET /api/workshops` remains allowed below 100 requests per minute.
- [x] 5.6 Verify over-limit workshop reads return HTTP 429 with `Retry-After`.
- [x] 5.7 Verify 429 frontend messages include the retry delay when the header is present.
- [ ] 5.8 Verify rate-limit keys are stored in Redis and shared by multiple local backend instances.
