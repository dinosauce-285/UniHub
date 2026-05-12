import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrganizerWorkshops, resolveRoomMapUrl } from '../../lib/workshopsApi';
import type { Workshop, WorkshopStatus } from '../../types/registration';
import { getApiErrorMessage } from '../../utils/errors';
import { formatPrice, formatSchedule } from '../../utils/formatters';

type StatusFilter = WorkshopStatus | 'ALL';
type PaymentFilter = 'ALL' | 'FREE' | 'PAID';
type SortOption = 'UPCOMING' | 'RECENT' | 'STATUS';

const statuses: WorkshopStatus[] = ['DRAFT', 'OPEN', 'CANCELLED', 'COMPLETED'];

const statusLabels: Record<WorkshopStatus, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

const statusBadgeClasses: Record<WorkshopStatus, string> = {
  DRAFT: 'border-border bg-surface-muted text-muted',
  OPEN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  COMPLETED: 'border-primary/20 bg-primary/10 text-primary',
};

const statusSortOrder: Record<WorkshopStatus, number> = {
  OPEN: 0,
  DRAFT: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

function getUsedSlots(workshop: Workshop) {
  return Math.max(workshop.totalSlots - workshop.slotLeft, 0);
}

function matchesSearch(workshop: Workshop, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const searchableText = `${workshop.title} ${workshop.speaker} ${workshop.room}`;
  return searchableText.toLowerCase().includes(searchTerm);
}

function WorkshopCardSkeleton() {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-20 rounded-md bg-surface-muted" />
        <div className="h-6 w-16 rounded-md bg-surface-muted" />
        <div className="h-6 w-24 rounded-md bg-surface-muted" />
      </div>
      <div className="mt-5 h-6 w-3/5 rounded bg-surface-muted" />
      <div className="mt-3 h-4 w-2/5 rounded bg-surface-muted" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="rounded-md border border-border bg-surface p-3" key={index}>
            <div className="h-3 w-20 rounded bg-surface-muted" />
            <div className="mt-3 h-4 w-28 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <div className="h-9 w-20 rounded-md bg-surface-muted" />
      </div>
    </article>
  );
}

export function OrganizerWorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('UPCOMING');

  const visibleWorkshops = useMemo(() => {
    const searchTerm = searchInput.trim().toLowerCase();

    return workshops
      .filter((workshop) => matchesSearch(workshop, searchTerm))
      .filter((workshop) =>
        statusFilter === 'ALL' ? true : workshop.status === statusFilter,
      )
      .filter((workshop) => {
        if (paymentFilter === 'ALL') {
          return true;
        }

        return paymentFilter === 'PAID' ? workshop.isPaid : !workshop.isPaid;
      })
      .sort((left, right) => {
        if (sortOption === 'RECENT') {
          return (
            new Date(right.startTime).getTime() - new Date(left.startTime).getTime()
          );
        }

        if (sortOption === 'STATUS') {
          const statusDifference =
            statusSortOrder[left.status] - statusSortOrder[right.status];

          if (statusDifference !== 0) {
            return statusDifference;
          }
        }

        return (
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
        );
      });
  }, [paymentFilter, searchInput, sortOption, statusFilter, workshops]);

  const hasActiveFilters =
    searchInput.trim() !== '' || statusFilter !== 'ALL' || paymentFilter !== 'ALL';

  useEffect(() => {
    void loadWorkshops();
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

  function clearFilters() {
    setSearchInput('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setSortOption('UPCOMING');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Workshops
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            Manage workshops
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Browse schedules, capacity, publication status, and workshop assets from
            one focused overview.
          </p>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold hover:bg-red-100"
              disabled={loading}
              type="button"
              onClick={() => void loadWorkshops()}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_150px_180px] lg:items-end">
          <label className="block">
            <span className="text-sm font-medium text-ink">Search workshops</span>
            <input
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Search title, speaker, or room"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Status</span>
            <select
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="ALL">All</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Payment</span>
            <select
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
            >
              <option value="ALL">All</option>
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Sort</span>
            <select
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
            >
              <option value="UPCOMING">Upcoming first</option>
              <option value="RECENT">Recently started</option>
              <option value="STATUS">Status</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {loading ? 0 : visibleWorkshops.length} of {workshops.length}{' '}
            workshops
          </p>
          {hasActiveFilters ? (
            <button
              className="self-start rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted sm:self-auto"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      <div className="space-y-4">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <WorkshopCardSkeleton key={index} />
            ))}
          </>
        ) : null}

        {!loading && workshops.length === 0 ? (
          <section className="rounded-lg border border-border bg-surface p-6 shadow-card">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                No workshops yet
              </p>
              <h2 className="mt-2 text-xl font-semibold text-ink">
                Create your first workshop
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Once workshops are created, this page becomes the management overview
                for status, capacity, schedule, pricing, and room map readiness.
              </p>
              <Link
                className="mt-5 inline-flex rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary/90"
                to="/organizer/workshops/new"
              >
                Create workshop
              </Link>
            </div>
          </section>
        ) : null}

        {!loading && workshops.length > 0 && visibleWorkshops.length === 0 ? (
          <section className="rounded-lg border border-border bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">
              No workshops match these filters
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Adjust the search, status, or payment filter to widen the result set.
            </p>
            <button
              className="mt-5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </section>
        ) : null}

        {!loading
          ? visibleWorkshops.map((workshop) => {
              const usedSlots = getUsedSlots(workshop);

              return (
                <article
                  className="rounded-lg border border-border bg-surface p-5 shadow-card transition hover:border-primary/30 hover:shadow-md"
                  key={workshop.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                            statusBadgeClasses[workshop.status]
                          }`}
                        >
                          {statusLabels[workshop.status]}
                        </span>
                        <span
                          className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
                            workshop.isPaid
                              ? 'border-primary/20 bg-primary/10 text-primary'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {workshop.isPaid ? 'Paid' : 'Free'}
                        </span>
                        <span
                          className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
                            workshop.roomMapUrl
                              ? 'border-border bg-surface-muted text-muted'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {workshop.roomMapUrl ? 'Map attached' : 'No map'}
                        </span>
                      </div>

                      <Link
                        className="mt-4 block max-w-3xl truncate text-xl font-semibold text-ink hover:text-primary"
                        to={`/organizer/workshops/${workshop.id}/edit`}
                      >
                        {workshop.title}
                      </Link>
                      <p className="mt-1 truncate text-sm leading-6 text-muted">
                        {workshop.speaker} - {workshop.room}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md border border-border bg-surface p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Schedule
                      </dt>
                      <dd className="mt-2 text-ink">
                        {formatSchedule(workshop.startTime, workshop.endTime)}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Slots used
                      </dt>
                      <dd className="mt-2 font-semibold text-ink">
                        {usedSlots} / {workshop.totalSlots}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Slots left
                      </dt>
                      <dd className="mt-2 font-semibold text-ink">
                        {workshop.slotLeft}
                      </dd>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Payment
                      </dt>
                      <dd className="mt-2 font-semibold text-ink">
                        {formatPrice(workshop)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted">
                      Status changes are managed from the edit page.
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      {workshop.roomMapUrl ? (
                        <a
                          className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
                          href={resolveRoomMapUrl(workshop.roomMapUrl)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open room map
                        </a>
                      ) : null}
                      <Link
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary/90"
                        to={`/organizer/workshops/${workshop.id}/edit`}
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          : null}
      </div>
    </div>
  );
}

export { OrganizerWorkshopsPage as WorkshopsPage };
