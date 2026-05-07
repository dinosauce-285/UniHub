import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Toast, type ToastState } from '../../components/Toast';
import {
  createRegistration,
  listMyRegistrations,
} from '../../lib/registrationApi';
import { listWorkshops } from '../../lib/workshopsApi';
import type { Registration, Workshop } from '../../types/registration';
import { getApiErrorMessage } from '../../utils/errors';
import { formatPrice, formatSchedule } from '../../utils/formatters';

const SLOT_POLL_INTERVAL_MS = 10_000;

export function StudentWorkspace() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [actionWorkshopId, setActionWorkshopId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [refreshWarning, setRefreshWarning] = useState('');

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    async function loadRegistrationData() {
      setIsLoading(true);
      setLoadingError('');

      try {
        const [workshopData, registrationData] = await Promise.all([
          listWorkshops(),
          listMyRegistrations(),
        ]);

        if (isMounted) {
          setWorkshops(workshopData);
          setRegistrations(registrationData);
        }
      } catch (error) {
        if (isMounted) {
          setLoadingError(
            getApiErrorMessage(
              error,
              'Unable to load workshops right now. Please try again.',
            ),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    async function refreshWorkshopSlots() {
      if (!isMounted || document.visibilityState !== 'visible') {
        return;
      }

      try {
        const workshopData = await listWorkshops();

        if (isMounted) {
          setWorkshops(workshopData);
          setRefreshWarning('');
          schedulePoll();
        }
      } catch (error) {
        if (isMounted) {
          setRefreshWarning(
            getApiErrorMessage(
              error,
              'Unable to refresh slot counts. Showing the last successful update.',
            ),
          );
          schedulePoll();
        }
      }
    }

    function schedulePoll() {
      if (pollTimer) {
        clearTimeout(pollTimer);
      }

      if (document.visibilityState === 'visible') {
        pollTimer = setTimeout(refreshWorkshopSlots, SLOT_POLL_INTERVAL_MS);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshWorkshopSlots();
      } else if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = undefined;
      }
    }

    loadRegistrationData();
    schedulePoll();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function handleRegister(workshop: Workshop) {
    const wasAlreadyRegistered = registrations.some(
      (registration) => registration.workshopId === workshop.id,
    );

    setActionWorkshopId(workshop.id);

    try {
      const registration = await createRegistration(workshop.id);
      setRegistrations((current) => [
        registration,
        ...current.filter((item) => item.id !== registration.id),
      ]);

      if (!wasAlreadyRegistered) {
        setWorkshops((current) =>
          current.map((item) =>
            item.id === workshop.id
              ? { ...item, slotLeft: Math.max(item.slotLeft - 1, 0) }
              : item,
          ),
        );
      }

      setToast({
        id: Date.now(),
        message:
          registration.paymentStatus === 'PENDING'
            ? `Seat held for ${registration.workshop.title}. Email confirmation is being sent. Complete payment from My workshops.`
            : `Seat confirmed for ${registration.workshop.title}. Email confirmation is being sent.`,
        variant: 'success',
      });
    } catch (error) {
      setToast({
        id: Date.now(),
        message: getApiErrorMessage(
          error,
          'Unable to register for this workshop. Please try again.',
        ),
        variant: 'warning',
      });
    } finally {
      setActionWorkshopId(null);
    }
  }

  const latestRegistration = registrations[0];

  return (
    <div className="space-y-8">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Student registration
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Claim your workshop seat
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Open workshops are loaded from the API. Each registration request uses
          a fresh idempotency key, and the backend returns a QR confirmation when
          your slot is safely claimed.
        </p>
      </div>

      {loadingError ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-ink">
          {loadingError}
        </p>
      ) : null}

      {refreshWarning ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-ink">
          {refreshWarning}
        </p>
      ) : null}

      {latestRegistration?.qrCodeImage ? (
        <section className="grid gap-5 rounded-lg border border-success/30 bg-success/10 p-5 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-success">
              Latest confirmation
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink">
              {latestRegistration.workshop.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {formatSchedule(
                latestRegistration.workshop.startTime,
                latestRegistration.workshop.endTime,
              )}
            </p>
            <p className="mt-2 text-sm text-muted">
              QR payload: {latestRegistration.qrCode}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <img
              className="h-40 w-40 rounded-md border border-border bg-surface p-2"
              src={latestRegistration.qrCodeImage}
              alt={`QR code for ${latestRegistration.workshop.title}`}
            />
            <a
              className="rounded-md bg-success px-3 py-1.5 text-sm font-semibold text-primary-contrast"
              href={latestRegistration.qrCodeImage}
              download={`${latestRegistration.workshop.id}-qr.png`}
            >
              Download QR
            </a>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Open workshops
            </p>
            <h2 className="text-xl font-semibold text-ink">Available seats</h2>
          </div>
          {isLoading ? (
            <span className="rounded-md bg-surface-muted px-3 py-1 text-sm text-muted">
              Loading...
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {workshops.map((workshop) => {
            const isRegistered = registrations.some(
              (registration) => registration.workshopId === workshop.id,
            );
            const isFull = workshop.slotLeft <= 0;
            const isRegistering = actionWorkshopId === workshop.id;

            return (
              <article
                className="rounded-lg border border-border bg-surface p-5 shadow-card"
                key={workshop.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-md bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    {workshop.room}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {formatPrice(workshop)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">
                  <Link
                    className="hover:text-primary"
                    to={`/student/workshops/${workshop.id}`}
                  >
                    {workshop.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {workshop.description}
                </p>
                <p className="mt-3 text-sm text-muted">
                  Speaker: {workshop.speaker}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatSchedule(workshop.startTime, workshop.endTime)}
                </p>
                <div className="mt-5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-ink">
                      {workshop.slotLeft} seats left
                    </span>
                    <span className="text-muted">
                      {workshop.totalSlots} total
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            (workshop.slotLeft / workshop.totalSlots) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  type="button"
                  disabled={isRegistered || isFull || isRegistering}
                  onClick={() => handleRegister(workshop)}
                >
                  {isRegistered
                    ? 'Registered'
                    : isFull
                      ? 'Workshop full'
                      : isRegistering
                        ? 'Claiming seat...'
                        : 'Claim seat'}
                </button>
                <Link
                  className="mt-3 block text-center text-sm font-semibold text-primary hover:text-primary/80"
                  to={`/student/workshops/${workshop.id}`}
                >
                  View details
                </Link>
              </article>
            );
          })}
        </div>

        {!isLoading && workshops.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
            No open workshops are available yet.
          </p>
        ) : null}
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          My workshops
        </p>
        <div className="mt-3 space-y-3">
          {registrations.map((registration) => (
            <article
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4"
              key={registration.id}
            >
              <div>
                <h3 className="font-semibold text-ink">
                  {registration.workshop.title}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {registration.status} - {registration.paymentStatus} -{' '}
                  {registration.workshop.room}
                </p>
                {registration.workshop.isPaid &&
                registration.paymentStatus === 'PENDING' ? (
                  <p className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-ink">
                    Payment pending. Complete payment to finish this paid
                    registration.
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {registration.workshop.isPaid &&
                registration.paymentStatus === 'PENDING' ? (
                  <Link
                    className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-contrast transition hover:bg-primary/90"
                    to={`/student/payments/${registration.id}`}
                  >
                    Complete payment
                  </Link>
                ) : null}
                {registration.qrCodeImage ? (
                  <img
                    className="h-20 w-20 rounded-md border border-border bg-surface p-1"
                    src={registration.qrCodeImage}
                    alt={`QR code for ${registration.workshop.title}`}
                  />
                ) : null}
              </div>
            </article>
          ))}

          {!isLoading && registrations.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              Your confirmed workshops will appear here after registration.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
