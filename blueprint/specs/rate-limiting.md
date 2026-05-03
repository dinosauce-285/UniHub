# Specification: Rate Limiting

## Description
A shield that protects the Backend API from traffic spikes, especially when registration opens, using the Token Bucket algorithm through `@nestjs/throttler` with Redis-backed storage.

## Main Flow
1. A client request passes through NestJS `ThrottlerGuard`.
2. The guard looks up the token bucket in Redis by IP or User ID.
3. **Token available**: Subtract one token and allow the request to continue.
4. **No token available**: Block the request and return HTTP 429 Too Many Requests with the `Retry-After` header.
5. Redis TTL automatically refills tokens according to the configured window.

## Error Scenarios
- **Sensitive endpoint spam**: Someone calls `POST /registrations` more than 10 times within 10 seconds. The 11th request automatically receives 429.
- **Normal browsing**: A student browses the workshop list below 100 requests per minute, and everything passes smoothly.
- **Only the abuser is affected**: A spammer who exceeds the rate limit is blocked without affecting valid users because each user has a separate token bucket.

## Constraints
- Token storage must be Redis-backed so the system is ready for horizontally scaled backend nodes.
- The `Retry-After` header must appear in every 429 response.
- Apply a global guard, while configuring flexible limits for different routes.

## Acceptance Criteria
- The server does not crash or become exhausted when someone auto-clicks the API.
- Requests above the limit are blocked in time.
- Rate limiting happens independently and does not block legitimate student registrations.
