import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createRegistration, listMyRegistrations } from '../../lib/registrationApi';
import { getWorkshop, resolveRoomMapUrl } from '../../lib/workshopsApi';
import type { Registration, Workshop } from '../../types/registration';
import { getApiErrorMessage } from '../../utils/errors';
import { formatPrice, formatSchedule } from '../../utils/formatters';

function isImageRoomMap(roomMapUrl: string) {
  return /\.(png|jpe?g|webp|svg)(\?.*)?$/i.test(roomMapUrl);
}

export function WorkshopDetailPage() {
  const { id } = useParams();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      if (!id) {
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        const [workshopData, registrationData] = await Promise.all([
          getWorkshop(id),
          listMyRegistrations(),
        ]);

        if (isMounted) {
          setWorkshop(workshopData);
          setRegistrations(registrationData);
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err, 'Unable to load workshop details.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleRegister() {
    if (!workshop) {
      return;
    }

    try {
      setIsRegistering(true);
      setError('');
      setNotice('');
      const registration = await createRegistration(workshop.id);
      setRegistrations((current) => [
        registration,
        ...current.filter((item) => item.id !== registration.id),
      ]);
      setWorkshop((current) =>
        current
          ? { ...current, slotLeft: Math.max(current.slotLeft - 1, 0) }
          : current,
      );
      setNotice(`Seat confirmed for ${registration.workshop.title}.`);
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Unable to register for this workshop.'),
      );
    } finally {
      setIsRegistering(false);
    }
  }

  const isRegistered = registrations.some(
    (registration) => registration.workshopId === workshop?.id,
  );
  const isFull = (workshop?.slotLeft ?? 0) <= 0;
  const resolvedRoomMapUrl = workshop?.roomMapUrl
    ? resolveRoomMapUrl(workshop.roomMapUrl)
    : null;
  const canRegister = Boolean(
    workshop &&
      workshop.status === 'OPEN' &&
      !isRegistered &&
      !isFull &&
      !isRegistering,
  );

  return (
    <div className="space-y-6">
      <Link className="text-sm font-semibold text-primary" to="/student">
        Back to workshops
      </Link>

      {isLoading ? (
        <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
          Loading workshop details...
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-ink">
          {notice}
        </p>
      ) : null}

      {workshop ? (
        <article className="rounded-lg border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-md bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {workshop.status}
            </span>
            <span className="text-sm font-semibold text-primary">
              {formatPrice(workshop)}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-ink">
            {workshop.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {workshop.description}
          </p>

          <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">Speaker</dt>
              <dd className="mt-1 text-muted">{workshop.speaker}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Room</dt>
              <dd className="mt-1 text-muted">{workshop.room}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Schedule</dt>
              <dd className="mt-1 text-muted">
                {formatSchedule(workshop.startTime, workshop.endTime)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Seats</dt>
              <dd className="mt-1 text-muted">
                {workshop.slotLeft} of {workshop.totalSlots} available
              </dd>
            </div>
          </dl>

          {resolvedRoomMapUrl ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-ink">Room map</h2>
              {isImageRoomMap(resolvedRoomMapUrl) ? (
                <img
                  className="mt-3 max-h-80 w-full rounded-md border border-border object-contain"
                  src={resolvedRoomMapUrl}
                  alt={`Room map for ${workshop.title}`}
                />
              ) : (
                <a
                  className="mt-3 inline-block text-sm font-semibold text-primary"
                  href={resolvedRoomMapUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open room map
                </a>
              )}
            </div>
          ) : null}

          {workshop.aiSummary ? (
            <div className="mt-6 rounded-md bg-surface-muted p-4">
              <h2 className="text-sm font-semibold text-ink">AI Summary</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                {workshop.aiSummary}
              </p>
            </div>
          ) : null}

          <button
            className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            disabled={!canRegister}
            onClick={handleRegister}
          >
            {isRegistered
              ? 'Registered'
              : workshop.status !== 'OPEN'
                ? 'Registration closed'
                : isFull
                  ? 'Workshop full'
                  : isRegistering
                    ? 'Claiming seat...'
                    : 'Claim seat'}
          </button>
        </article>
      ) : null}
    </div>
  );
}
