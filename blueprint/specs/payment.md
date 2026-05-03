# Specification: Payment Circuit Breaker

## Description
Payment flow for paid workshops. Integrates the Circuit Breaker design pattern to handle unstable external payment gateways, combined with an Idempotency Key to prevent double charges.

## Main Flow
1. The frontend requests payment for a workshop.
2. The backend sends a UUID (Idempotency Key) through the Mock Payment Gateway, wrapped by the `opossum` Circuit Breaker.
3. **Success**: Update `Registration.paymentStatus = PAID` and return the invoice to the student.
4. **Circuit OPEN**: The payment gateway is down -> the backend immediately returns `{ canPay: false }`. The frontend hides the payment button instead of spinning forever (Graceful Degradation).

## Error Scenarios
- **Unstable payment gateway**: Failures below the circuit-break threshold -> return HTTP 502 and let the student retry.
- **Payment gateway overload**: Errors exceed the 50% threshold -> the Circuit Breaker moves to OPEN and refuses to send requests for 30 seconds to protect the network.
- **Repeated payment clicks**: The Idempotency Key locks duplicate requests, returns the previous result stored in Redis, and does not call the payment gateway a second time.

## Constraints
- The Circuit Breaker uses the `opossum` library with thresholds: open after 50% failures, retry after 30 seconds (Half-Open).
- Free features (browsing workshops and free registration) must not be affected when the payment circuit is open.
- The mock gateway is configured to randomly fail 30% of the time to simulate real incidents.

## Acceptance Criteria
- A continuously failing payment gateway triggers the OPEN circuit.
- An OPEN circuit returns a graceful fallback payload without trying to call the gateway (fast-fail).
- Retrying with the same Idempotency Key prevents a second charge.
