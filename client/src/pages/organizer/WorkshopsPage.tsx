import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listOrganizerWorkshops,
  resolveRoomMapUrl,
  updateWorkshopStatus,
  uploadWorkshopAiSummary,
} from '../../lib/workshopsApi';
import type { Workshop, WorkshopStatus } from '../../types/registration';
import { getApiErrorMessage } from '../../utils/errors';
import { formatPrice, formatSchedule } from '../../utils/formatters';

const statuses: WorkshopStatus[] = ['DRAFT', 'OPEN', 'CANCELLED', 'COMPLETED'];

export function OrganizerWorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusActionId, setStatusActionId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const sortedWorkshops = useMemo(
    () =>
      [...workshops].sort(
        (left, right) =>
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
      ),
    [workshops],
  );

  useEffect(() => {
    loadWorkshops();
  }, []);

  async function loadWorkshops() {
    try {
      setLoading(true);
      const data = await listOrganizerWorkshops();
      setWorkshops(data);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load workshops'));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    workshop: Workshop,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const nextStatus = event.target.value as WorkshopStatus;
    if (nextStatus === workshop.status) {
      return;
    }

    try {
      setStatusActionId(workshop.id);
      setError('');
      const updated = await updateWorkshopStatus(workshop.id, nextStatus);
      setWorkshops((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update status'));
    } finally {
      setStatusActionId(null);
    }
  }

  async function handlePdfUpload(workshopId: string, file: File) {
    try {
      setUploadingId(workshopId);
      setError('');
      const result = await uploadWorkshopAiSummary(workshopId, file);
      if (result.queued) {
        setTimeout(() => loadWorkshops(), 3000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to upload PDF'));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Workshops
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            Manage workshops
          </h1>
        </div>
        <Link
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary/90"
          to="/organizer/workshops/new"
        >
          Create workshop
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
            Loading workshops...
          </p>
        ) : null}

        {!loading && sortedWorkshops.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            No workshops have been created yet.
          </div>
        ) : null}

        {sortedWorkshops.map((workshop) => (
          <article
            className="grid gap-4 rounded-lg border border-border bg-surface p-5 shadow-card md:grid-cols-[minmax(0,1fr)_220px]"
            key={workshop.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {workshop.status}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {formatPrice(workshop)}
                </span>
                <span className="text-xs font-medium text-muted">
                  {workshop.roomMapUrl ? 'Room map attached' : 'No room map'}
                </span>
              </div>

              <h2 className="mt-3 truncate text-lg font-semibold text-ink">
                {workshop.title}
              </h2>
              <p className="mt-1 truncate text-sm text-muted">
                {workshop.speaker} - {workshop.room}
              </p>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="font-semibold text-ink">Schedule</dt>
                  <dd className="mt-1 text-muted">
                    {formatSchedule(workshop.startTime, workshop.endTime)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Total slots</dt>
                  <dd className="mt-1 text-muted">{workshop.totalSlots}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Slots left</dt>
                  <dd className="mt-1 text-muted">{workshop.slotLeft}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Room map</dt>
                  <dd className="mt-1 text-muted">
                    {workshop.roomMapUrl ? (
                      <a
                        className="font-semibold text-primary"
                        href={resolveRoomMapUrl(workshop.roomMapUrl)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open
                      </a>
                    ) : (
                      'Missing'
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-2 md:items-stretch">
              <Link
                className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
                to={`/organizer/workshops/${workshop.id}/edit`}
              >
                Edit
              </Link>
              <label className="flex h-10 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted">
                <span className="sr-only">Change status</span>
                <select
                  className="h-full w-full cursor-pointer appearance-none bg-transparent text-center text-sm font-semibold text-ink outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={statusActionId === workshop.id}
                  value={workshop.status}
                  onChange={(event) => handleStatusChange(workshop, event)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border px-3 py-2 text-center text-sm font-semibold text-ink hover:bg-surface-muted">
                {uploadingId === workshop.id ? 'Uploading...' : 'AI PDF'}
                <input
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  disabled={uploadingId === workshop.id}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handlePdfUpload(workshop.id, file);
                    }
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export { OrganizerWorkshopsPage as WorkshopsPage };
