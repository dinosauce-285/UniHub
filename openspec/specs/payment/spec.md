# Payment Specification

## Purpose
Provides a resilient paid registration path using a Circuit Breaker pattern and Graceful Degradation.

## Requirements

### Requirement: Payment Gateway Integration
The system SHALL route paid workshop payments through a mock payment gateway wrapped in a Circuit Breaker.

#### Scenario: Successful payment
- GIVEN a paid workshop and a student's payment request
- WHEN the circuit is CLOSED and the gateway succeeds
- THEN the Registration paymentStatus is updated to PAID
- AND the response includes a success confirmation

#### Scenario: Gateway failure below threshold
- GIVEN a gateway that randomly fails below 50%
- WHEN payment requests are processed
- THEN the circuit remains CLOSED
- AND individual failures return HTTP 502 to the client

### Requirement: Circuit Breaker
The system SHALL implement a circuit breaker with three states: CLOSED, OPEN, HALF-OPEN.

#### Scenario: Circuit opens after threshold
- GIVEN ≥50% of recent payment requests have failed
- WHEN the next payment request arrives
- THEN the circuit transitions to OPEN
- AND all subsequent payment attempts return the fallback immediately (no gateway call)

#### Scenario: Half-open probe
- GIVEN the circuit has been OPEN for 30 seconds
- WHEN the next request arrives
- THEN the circuit transitions to HALF-OPEN
- AND one probe request is sent to the gateway
- AND on success the circuit returns to CLOSED; on failure it reopens

### Requirement: Graceful Degradation
The system SHALL return a structured fallback when the circuit is OPEN so the frontend can respond gracefully.

#### Scenario: Open circuit fallback
- GIVEN the circuit is OPEN
- WHEN a payment is attempted
- THEN HTTP 200 is returned with `{ "canPay": false, "reason": "payment_unavailable" }`
- AND non-payment features (browse, view workshop, check-in) remain fully operational

### Requirement: Payment Idempotency
The system SHALL apply an Idempotency-Key to payment requests to prevent double-charging on client retry.

#### Scenario: Duplicate payment request
- GIVEN a successful payment with Idempotency-Key "pay-uuid-456"
- WHEN the client retries with the same key
- THEN the cached payment result is returned
- AND no second charge is attempted

## Constraints
- Circuit Breaker threshold: 50% error rate, reset timeout 30 seconds (using `opossum` npm)
- Payment gateway is mocked internally with a 30% random failure rate
- Workshop browsing and check-in MUST be unaffected by payment circuit state

## Acceptance Criteria
- Repeated gateway failures open the circuit after the threshold is reached
- An open circuit returns a graceful `canPay: false` payload without calling the gateway
- Double payment is prevented by the idempotency key mechanism
