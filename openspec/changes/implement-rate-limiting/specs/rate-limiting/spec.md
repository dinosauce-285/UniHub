# Rate Limiting Specification

## Purpose
Define how API traffic spikes are controlled fairly with Redis-backed rate limiting.

## Requirements

### Requirement: Redis-backed token bucket
The system SHALL protect API endpoints from traffic spikes using token bucket rate limiting backed by Redis.

#### Scenario: Request under limit
- GIVEN a client has remaining tokens
- WHEN the request passes through `ThrottlerGuard`
- THEN one token is consumed
- AND the request continues to the endpoint

#### Scenario: Request over limit
- GIVEN a client has no remaining tokens
- WHEN the request passes through `ThrottlerGuard`
- THEN the backend returns HTTP 429 Too Many Requests
- AND includes the `Retry-After` header

### Requirement: Endpoint-specific limits
The system SHALL support different rate limits for sensitive and read-heavy endpoints.

#### Scenario: Registration spam
- GIVEN a client calls `POST /registrations` more than 10 times in 10 seconds
- WHEN the next request arrives
- THEN the backend rejects it with HTTP 429

#### Scenario: Normal browsing
- GIVEN a student browses workshops below 100 requests per minute
- WHEN the student calls workshop read endpoints
- THEN the backend allows the requests

## Constraints
- Implementation MUST cover both backend API/business logic and frontend user-facing flows unless a written proposal explicitly marks one side out of scope.
- Frontend implementation MUST first look for reusable components in `client/src/components`, use the theme setup from `client/src/index.css` and `client/tailwind.config.ts`, and create a shared component only when no suitable component exists.
- Token state MUST be stored in Redis for horizontally scaled backend nodes.
- Every 429 response MUST include `Retry-After`.
- Rate limiting SHOULD apply globally with route-specific overrides.
