## Why

Paid workshops currently stop at `Registration.paymentStatus = PENDING`; `PaymentModule` only exposes a stub status endpoint. Students need a way to complete paid registrations, retry safely when the mock gateway fails, and avoid duplicate charges when the browser or network retries the same payment request.

The payment spec is the source of truth for this change: paid workshop payment through a mock gateway wrapped by an `opossum` Circuit Breaker, `{ canPay: false }` fast-fail behavior when the circuit is open, and payment idempotency with an `Idempotency-Key`.

## What Changes

- Add a real `PaymentService` behind `PaymentController`.
- Add a mock payment gateway client that randomly fails 30 percent of the time in development.
- Wrap gateway calls in an `opossum` Circuit Breaker with a 50 percent error threshold and 30 second reset timeout.
- Add a protected student payment endpoint for existing paid registrations with `PaymentStatus.PENDING`.
- Store minimal payment attempt records only for payment idempotency and the resulting gateway response, so retrying the same `Idempotency-Key` returns the prior result without calling the gateway again.
- Update successful payments to `Registration.paymentStatus = PAID`; gateway failures below threshold return HTTP 502 and leave the registration retryable.
- Keep the existing registration Redis `DECR` slot claiming behavior unchanged.
- Keep free workshop registration working even when payment is unavailable.
- Keep workshop list/detail pages loading even when payment is unavailable.
- Add minimal frontend payment API/types and UI states for pending paid registrations, a "Pay now" action, success/failure messages, and circuit-open degradation banner.

In scope:
- Backend payment API and business logic in NestJS.
- Mock gateway and Circuit Breaker behavior.
- Minimal payment attempt storage for retry safety and duplicate charge prevention.
- Student-facing payment controls only where existing registration UI needs pending payment state/action.

Out of scope:
- Real payment gateway integration.
- Order, invoice, refund, settlement, or admin finance workflows.
- Changing workshop slot claiming, registration idempotency, QR generation, check-in, notification, CSV import, or AI summary behavior.
- Restoring or compensating workshop slots when payment fails or the circuit is open.
- Large frontend redesign or unrelated workshop/registration UI changes.
- Splitting payment into smaller specs.
- Production monitoring, reconciliation jobs, refunds, or admin financial reports.

Key risks:
- If payment idempotency is only cached in Redis, a Redis flush could allow duplicate gateway calls. The implementation should persist a minimal idempotency record and stored payment result, not a broader finance model.
- Circuit Breaker must protect only payment calls; it must not block free registration or workshop browsing.
- Existing paid registration creates a seat before payment. The proposal intentionally preserves this behavior to avoid changing registration slot semantics, but abandoned pending registrations may reserve seats until a later cleanup feature exists.
- Gateway timeout and failure handling must not accidentally mark a registration as `PAID`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `payment`: Implement paid registration payment, Circuit Breaker fallback, mock gateway failure behavior, and idempotent payment retry.

## Impact

- Backend modules: `server/src/modules/payment`, `server/src/modules/registration`, `server/src/core/redis`, `server/src/core/prisma`.
- Frontend modules: `client/src/lib/paymentApi.ts`, `client/src/types/registration.ts`, student workspace/detail pages that display and pay pending registrations.
- Database: Add minimal durable `PaymentAttempt` idempotency storage if needed to prevent duplicate payment charges and store the payment result.
- Configuration: Add mock gateway and breaker constants or environment overrides that preserve the required 50 percent threshold and 30 second reset timeout.
- APIs:
  - `GET /api/payment/status`
  - `POST /api/payment/registrations/:registrationId/pay` with `Idempotency-Key`
