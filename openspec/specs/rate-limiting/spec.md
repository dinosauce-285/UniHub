# Rate Limiting Specification

## Purpose
Protect the backend API from traffic spikes — especially during the first minutes of registration opening — using Token Bucket rate limiting via `@nestjs/throttler` with a Redis store.

## Requirements

### Requirement: Per-Endpoint Rate Limiting
The system SHALL enforce rate limits on high-traffic endpoints using Token Bucket algorithm.

#### Scenario: Registration endpoint throttled
- GIVEN a client making more than 10 requests in 10 seconds to `POST /registrations`
- WHEN the 11th request arrives within the window
- THEN HTTP 429 Too Many Requests is returned
- AND the response includes a `Retry-After` header

#### Scenario: Workshop list within limit
- GIVEN a client browsing workshop list
- WHEN fewer than 100 requests per minute are made to `GET /workshops`
- THEN all requests are served normally

#### Scenario: Workshop list over limit
- GIVEN a client sending more than 100 GET /workshops requests per minute
- WHEN the 101st request arrives
- THEN HTTP 429 is returned with a `Retry-After` header

### Requirement: Fairness
The system SHALL apply rate limits per client (by IP or authenticated user) to ensure fairness among the 12,000 concurrent students.

#### Scenario: One aggressive client does not block others
- GIVEN one client exceeding their rate limit
- WHEN other clients send requests
- THEN other clients continue to receive normal responses

## Constraints
- Redis store MUST be used for rate limit counters (enables horizontal scaling)
- `Retry-After` header MUST be included in every 429 response
- Rate limits: 10 req/10s for `/registrations`; 100 req/min for `GET /workshops`

## Acceptance Criteria
- Clients exceeding the limit receive HTTP 429 with `Retry-After`
- Clients within the limit are unaffected
- Redis key expiry ensures counters reset correctly per window
