# Payment Spec

## Description

Provides a resilient paid registration path with circuit breaker fallback.

## Main flow

1. Frontend requests payment for a paid workshop.
2. Backend calls payment gateway through a circuit breaker.
3. On success, registration payment state is updated.
4. On circuit-open fallback, frontend disables the pay action gracefully.

## Error scenarios

- Gateway timeout
- Randomized gateway failure
- Duplicate payment retry

## Constraints

- Breaker state should prevent cascading retries
- Idempotency must protect against double charge attempts

## Acceptance criteria

- Repeated gateway failures open the circuit
- Open circuit returns a graceful fallback payload

