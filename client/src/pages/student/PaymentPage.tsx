import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Toast, type ToastState } from '../../components/Toast';
import { getPaymentStatus, payRegistration } from '../../lib/paymentApi';
import { listMyRegistrations } from '../../lib/registrationApi';
import type {
  PaymentStatusResponse,
  Registration,
} from '../../types/registration';
import { getApiErrorMessage } from '../../utils/errors';
import { formatPrice, formatSchedule } from '../../utils/formatters';

const paymentMethods = [
  {
    id: 'campus-card',
    label: 'Campus card',
    description: 'Mock balance authorization for local testing.',
  },
  {
    id: 'bank-transfer',
    label: 'Student bank transfer',
    description: 'Mock transfer confirmation, no real provider call.',
  },
  {
    id: 'desk-payment',
    label: 'Pay at event desk',
    description: 'Mock manual collection path for degraded testing.',
  },
];

function badgeClass(value: string) {
  if (value === 'PAID' || value === 'CONFIRMED' || value === 'FREE') {
    return 'border-success/40 bg-success/10 text-success';
  }

  if (value === 'PENDING' || value === 'FAILED') {
    return 'border-warning/40 bg-warning/10 text-warning';
  }

  return 'border-border bg-surface-muted text-muted';
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${badgeClass(value)}`}
    >
      {label}: {value}
    </span>
  );
}

function InlineAlert({
  title,
  message,
  tone,
  onDismiss,
}: {
  title: string;
  message: string;
  tone: 'success' | 'warning';
  onDismiss?: () => void;
}) {
  const styles =
    tone === 'success'
      ? 'border-success/30 bg-success/10'
      : 'border-warning/40 bg-warning/10';

  return (
    <div className={`rounded-md border p-4 ${styles}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{message}</p>
        </div>
        {onDismiss ? (
          <button
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink hover:bg-surface-muted"
            type="button"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PaymentPage() {
  const { registrationId } = useParams();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0].id);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPaymentPage() {
      setIsLoading(true);
      setLoadError('');

      const [registrationResult, statusResult] = await Promise.allSettled([
        listMyRegistrations(),
        getPaymentStatus(),
      ]);

      if (!isMounted) {
        return;
      }

      if (registrationResult.status === 'fulfilled') {
        setRegistrations(registrationResult.value);
      } else {
        setLoadError(
          getApiErrorMessage(
            registrationResult.reason,
            'Unable to load this payment registration.',
          ),
        );
      }

      if (statusResult.status === 'fulfilled') {
        setPaymentStatus(statusResult.value);
      } else {
        setPaymentStatus({
          canPay: false,
          reason:
            'Payment availability could not be checked. Please try again shortly.',
        });
      }

      setIsLoading(false);
    }

    loadPaymentPage();

    return () => {
      isMounted = false;
    };
  }, []);

  const registration = useMemo(
    () => registrations.find((item) => item.id === registrationId) ?? null,
    [registrationId, registrations],
  );

  const isPaidWorkshop = Boolean(registration?.workshop.isPaid);
  const isCancelledRegistration = registration?.status === 'CANCELLED';
  const hasCompletedOrFreePayment =
    registration?.paymentStatus === 'PAID' ||
    registration?.paymentStatus === 'FREE';
  const showPaymentForm =
    Boolean(registration) &&
    isPaidWorkshop &&
    !isCancelledRegistration &&
    !hasCompletedOrFreePayment;

  const unavailableReason = useMemo(() => {
    if (!registrationId) {
      return 'Payment registration is missing from the route.';
    }

    if (loadError) {
      return loadError;
    }

    if (!registration) {
      return isLoading
        ? ''
        : 'This registration was not found for your student account.';
    }

    if (!registration.workshop.isPaid) {
      return 'This workshop is free and does not need payment.';
    }

    if (registration.status === 'CANCELLED') {
      return 'This registration was cancelled and can no longer be paid.';
    }

    if (registration.paymentStatus === 'PAID') {
      return 'This registration is already paid.';
    }

    if (registration.paymentStatus === 'FREE') {
      return 'This registration does not require payment.';
    }

    if (paymentStatus && !paymentStatus.canPay) {
      return paymentStatus.reason ?? 'Payment is temporarily unavailable.';
    }

    return '';
  }, [isLoading, loadError, paymentStatus, registration, registrationId]);

  const canPay =
    showPaymentForm && paymentStatus?.canPay === true && !isPaying;

  async function handlePayNow() {
    if (!registration || !canPay) {
      return;
    }

    setIsPaying(true);
    setPaymentError('');

    try {
      const result = await payRegistration(registration.id);

      if (!result.canPay) {
        setPaymentStatus({ canPay: false, reason: result.reason });
        return;
      }

      setRegistrations((current) =>
        current.map((item) =>
          item.id === registration.id
            ? { ...item, paymentStatus: result.paymentStatus }
            : item,
        ),
      );
      setToast({
        id: Date.now(),
        message: `Payment confirmed for ${registration.workshop.title}.`,
        variant: 'success',
      });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Payment failed. You can retry this pending registration.',
      );

      setPaymentError(message);
      setToast({
        id: Date.now(),
        message,
        variant: 'warning',
      });
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="text-sm font-semibold text-primary" to="/student">
            Back to workshops
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">
            Student payment
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            Complete workshop payment
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review the registration, choose a mock payment method, and complete
            the pending paid workshop registration.
          </p>
        </div>
        {registration ? (
          <Link
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
            to={`/student/workshops/${registration.workshop.id}`}
          >
            View workshop
          </Link>
        ) : null}
      </header>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
          <p className="text-sm font-semibold text-ink">Loading payment...</p>
          <p className="mt-1 text-sm text-muted">
            Checking your registration and payment availability.
          </p>
        </div>
      ) : null}

      {!isLoading && unavailableReason && !showPaymentForm ? (
        <InlineAlert
          message={unavailableReason}
          title="Payment action unavailable"
          tone="warning"
        />
      ) : null}

      {registration ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="rounded-lg border border-border bg-surface p-6 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Order summary
                </p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  {registration.workshop.title}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="Registration" value={registration.status} />
                <StatusBadge label="Payment" value={registration.paymentStatus} />
              </div>
            </div>

            <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-md bg-surface-muted p-4">
                <dt className="font-semibold text-ink">Date and time</dt>
                <dd className="mt-1 text-muted">
                  {formatSchedule(
                    registration.workshop.startTime,
                    registration.workshop.endTime,
                  )}
                </dd>
              </div>
              <div className="rounded-md bg-surface-muted p-4">
                <dt className="font-semibold text-ink">Room</dt>
                <dd className="mt-1 text-muted">{registration.workshop.room}</dd>
              </div>
              <div className="rounded-md bg-surface-muted p-4">
                <dt className="font-semibold text-ink">Price</dt>
                <dd className="mt-1 text-muted">
                  {formatPrice(registration.workshop)}
                </dd>
              </div>
              <div className="rounded-md bg-surface-muted p-4">
                <dt className="font-semibold text-ink">Registration ID</dt>
                <dd className="mt-1 break-all text-muted">{registration.id}</dd>
              </div>
            </dl>

            {registration.workshop.isPaid &&
            !isCancelledRegistration &&
            registration.paymentStatus === 'PENDING' ? (
              <div className="mt-4">
                <InlineAlert
                  message={
                    registration.status === 'CONFIRMED'
                      ? 'Your seat is confirmed, but this paid registration still needs mock payment before checkout is complete.'
                      : 'Your seat is held, but this paid registration still needs mock payment before checkout is complete.'
                  }
                  title="Payment pending"
                  tone="warning"
                />
              </div>
            ) : null}

            {registration.paymentStatus === 'PAID' ? (
              <div className="mt-4">
                <InlineAlert
                  message="This registration is paid. You can return to your workshop list or view the workshop detail."
                  title="Payment complete"
                  tone="success"
                />
              </div>
            ) : null}
          </article>

          <aside className="space-y-5 rounded-lg border border-border bg-surface p-5 shadow-card">
            {showPaymentForm ? (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Checkout
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-ink">
                    Complete payment
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Choose a mock payment method and submit the outstanding
                    workshop fee for this registration.
                  </p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Amount due
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-ink">
                    {formatPrice(registration.workshop)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Registration #{registration.id.slice(0, 8)} for{' '}
                    {registration.workshop.title}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Payment method
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      This checkout is mocked for local testing. No live payment
                      provider is used.
                    </p>
                  </div>

                  {paymentMethods.map((method) => (
                    <label
                      className={`block rounded-lg border p-4 text-sm transition ${
                        selectedMethod === method.id
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-surface hover:bg-surface-muted'
                      }`}
                      key={method.id}
                    >
                      <span className="flex items-start gap-3">
                        <input
                          checked={selectedMethod === method.id}
                          className="mt-1"
                          disabled={!canPay}
                          name="payment-method"
                          type="radio"
                          value={method.id}
                          onChange={() => setSelectedMethod(method.id)}
                        />
                        <span>
                          <span className="block font-semibold text-ink">
                            {method.label}
                          </span>
                          <span className="mt-1 block leading-5 text-muted">
                            {method.description}
                          </span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                {paymentError ? (
                  <InlineAlert
                    message={paymentError}
                    title="Payment failed"
                    tone="warning"
                    onDismiss={() => setPaymentError('')}
                  />
                ) : null}

                {paymentStatus && !paymentStatus.canPay ? (
                  <InlineAlert
                    message={
                      paymentStatus.reason ??
                      'Payment is temporarily unavailable.'
                    }
                    title="Payment unavailable"
                    tone="warning"
                  />
                ) : null}

                <div className="space-y-3 border-t border-border pt-4">
                  <button
                    className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={!canPay}
                    type="button"
                    onClick={handlePayNow}
                  >
                    {isPaying ? 'Processing payment...' : 'Pay now'}
                  </button>

                  <p className="text-xs leading-5 text-muted">
                    This mock checkout does not create a real charge, invoice,
                    refund, settlement, or payout.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Payment action
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-ink">
                    No payment available
                  </h2>
                </div>
                <p className="text-sm leading-6 text-muted">
                  {registration.paymentStatus === 'PAID'
                    ? 'This registration is already paid.'
                    : unavailableReason ||
                      'This registration cannot be paid from this page.'}
                </p>
                <Link
                  className="block rounded-md border border-border px-4 py-2 text-center text-sm font-semibold text-ink hover:bg-surface-muted"
                  to="/student"
                >
                  Back to my workshops
                </Link>
              </>
            )}
          </aside>
        </section>
      ) : null}
    </div>
  );
}
