## 1. Scope Guard

- [x] 1.1 Keep this apply step limited to frontend payment UX under the existing `implement-payment` change.
- [x] 1.2 Do not change backend payment behavior unless a tiny student-owned registration detail API gap is proven necessary.
- [x] 1.3 Do not add real provider checkout, order, invoice, refund, settlement, payout, or admin finance behavior.
- [x] 1.4 Do not redesign workshop cards, student navigation, organizer pages, QR confirmation, or unrelated layout.

## 2. Student Payment Route and Page

- [x] 2.1 Add `/student/payments/:registrationId` through the existing React Router structure in `client/src/App.tsx`.
- [x] 2.2 Protect the route with the existing student-only `ProtectedRoute` and `WorkspaceLayout` pattern.
- [x] 2.3 Add a route-level student payment page under the existing student page/feature conventions.
- [x] 2.4 Load the target registration from existing student registration data and match it by `registrationId`.
- [x] 2.5 Treat unknown, unauthorized, free, cancelled, already-paid, or non-pending registrations as payment unavailable rather than showing a checkout CTA.
- [x] 2.6 Existing registration data supports the page safely; no backend API gap was needed.

## 3. Payment Page Layout and States

- [x] 3.1 Add a focused page header with a clear back/navigation affordance.
- [x] 3.2 Add an order/payment summary card showing workshop title, date/time, room, and price.
- [x] 3.3 Show registration status and payment status as badges.
- [x] 3.4 Add mock payment method selection without implying a real payment provider integration.
- [x] 3.5 Add a primary "Pay now" CTA that is available only for paid pending registrations when payment is available.
- [x] 3.6 Add local loading states for registration/payment availability loading and the Pay now submission.
- [x] 3.7 Add a success state after payment confirmation.
- [x] 3.8 Add a retryable failure state for gateway failure or HTTP 502.
- [x] 3.9 Add a payment unavailable state for `canPay=false`, payment status lookup failure, or ineligible registration.

## 4. Payment API Usage

- [x] 4.1 Reuse `client/src/lib/paymentApi.ts` for `GET /payment/status` and pay-registration calls.
- [x] 4.2 Keep payment idempotency keys payment-specific and generated only for payment attempts.
- [x] 4.3 Do not make workshop list/detail rendering depend on payment status calls.
- [x] 4.4 On `canPay=false`, block or disable Pay now with the returned explanation.
- [x] 4.5 On payment success, update or refetch only the affected registration state needed by the payment page and student pages.
- [x] 4.6 On retryable payment failure, leave the registration pending and keep retry available from the payment page.

## 5. Existing Student Page Navigation Changes

- [x] 5.1 Remove inline payment execution from `StudentWorkspace`.
- [x] 5.2 Remove inline payment execution from `WorkshopDetailPage`.
- [x] 5.3 Remove the awkward Pay now placement near QR confirmation.
- [x] 5.4 For paid pending registrations in `StudentWorkspace`, show only a clean "Complete payment" action linking to `/student/payments/:registrationId`.
- [x] 5.5 In `WorkshopDetailPage`, show "Complete payment" navigation for the current workshop only when the student has a paid pending registration.
- [x] 5.6 After registering for a paid workshop, show a clear next action to complete payment without replacing the existing registration flow.
- [x] 5.7 Leave free registration, QR display, room map, workshop cards, and organizer routes untouched except where necessary to remove inline payment controls.

## 6. Toast and Alert Feedback Cleanup

- [x] 6.1 Replace stacked permanent success/error messages with bounded feedback.
- [x] 6.2 Use dismissible toast-style feedback for registration success.
- [x] 6.3 Use dismissible toast-style feedback for payment success.
- [x] 6.4 Use dismissible toast-style feedback for retryable payment failure.
- [x] 6.5 Use inline alerts inside the relevant page/card for payment pending.
- [x] 6.6 Use inline alerts inside the relevant page/card for payment unavailable.
- [x] 6.7 Use inline alerts inside the relevant page/card for circuit-open or degraded payment state.
- [x] 6.8 Ensure every persistent alert is either dismissible or represents an ongoing state.

## 7. Degradation Handling

- [x] 7.1 If `GET /payment/status` returns `canPay=false`, show payment unavailable clearly on the payment page.
- [x] 7.2 Disable or block paid payment action with an explanation while payment is unavailable.
- [x] 7.3 Keep free workshop registration usable when payment status fails or payment is unavailable.
- [x] 7.4 Keep workshop list and detail pages rendering when payment status fails.
- [x] 7.5 Keep paid pending registrations visible with "Complete payment" navigation even when availability is unknown.
- [x] 7.6 Avoid permanent global degradation banners that clutter unrelated student workflows.

## 8. Focused Verification

- [x] 8.1 Run the frontend build.
- [x] 8.2 Verify `/student/payments/:registrationId` is student-protected and uses the existing workspace layout.
- [x] 8.3 Verify a paid pending registration can navigate from `StudentWorkspace` to the payment page.
- [x] 8.4 Verify a paid pending registration can navigate from `WorkshopDetailPage` to the payment page.
- [x] 8.5 Verify the payment page shows summary, mock method selection, Pay now, loading, success, retryable failure, and unavailable states.
- [x] 8.6 Verify `canPay=false` disables or blocks Pay now with a clear explanation.
- [x] 8.7 Verify free registration still works when payment is unavailable.
- [x] 8.8 Verify workshop list/detail pages still render when payment status calls fail.
- [x] 8.9 Verify success/failure feedback no longer appears as stacked permanent global banners.
- [x] 8.10 Verify no backend, organizer, checkout provider, finance, or unrelated layout behavior was changed.

## 9. Follow-up: Payment Eligibility Fix

- [x] 9.1 Update `PaymentPage` eligibility logic so paid `RegistrationStatus.CONFIRMED` plus `PaymentStatus.PENDING` is payable.
- [x] 9.2 Keep paid `RegistrationStatus.PENDING` plus `PaymentStatus.PENDING` payable if the backend can still return that state.
- [x] 9.3 Block payment only when `paymentStatus` is `PAID`, `FREE`, registration status is `CANCELLED`, the workshop is not paid, payment availability returns `canPay=false`, or the registration is unknown/unauthorized.
- [x] 9.4 Show mock payment method selection and the primary Pay now CTA for paid `CONFIRMED` + `PENDING` registrations when payment is available.
- [x] 9.5 Replace the incorrect unavailable copy for confirmed pending registrations with pending-payment copy that explains the seat is held and payment is still required.
- [x] 9.6 Improve checkout card polish in place with clearer spacing, labels, and CTA hierarchy without broad redesigning the student dashboard, route shell, workshop cards, QR confirmation, or navigation.
- [x] 9.7 Preserve the existing `/student/payments/:registrationId` route, toast behavior, free registration flow, QR display, and backend payment/registration behavior.
- [x] 9.8 Manually verify a paid `CONFIRMED` + `PENDING` registration shows the summary, mock method options, and Pay now CTA.
- [ ] 9.9 Manually verify blocked states still show payment unavailable for `PAID`, `FREE`, `CANCELLED`, unpaid workshops, `canPay=false`, and unknown/unauthorized registrations.
- [x] 9.10 Run the frontend build after the eligibility fix.
