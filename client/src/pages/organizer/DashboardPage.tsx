import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverviewStats } from '../../lib/statsApi';
import type { OverviewStats } from '../../types/stats';
import { getApiErrorMessage } from '../../utils/errors';

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
  status?: string;
  to?: string;
};

type BreakdownItem = {
  label: string;
  value: number;
  tone?: 'primary' | 'success' | 'warning' | 'muted';
};

type BreakdownCardProps = {
  title: string;
  description: string;
  items: BreakdownItem[];
  emptyMessage: string;
};

const fillClasses = {
  primary: 'bg-primary',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  muted: 'bg-slate-400',
} as const;

function formatPercent(part: number, total: number) {
  if (total <= 0) {
    return null;
  }

  return `${Math.round((part / total) * 100)}%`;
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function KpiCard({ label, value, hint, status, to }: KpiCardProps) {
  const content = (
    <>
      <div className="flex min-h-full flex-col">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {label}
        </p>
        <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
        <p className="mt-3 text-sm leading-5 text-muted">{hint}</p>
        {status ? (
          <p className="mt-4 rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">
            {status}
          </p>
        ) : null}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        aria-label={`${label}: ${value}`}
        className="block rounded-lg border border-border bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
        to={to}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      {content}
    </article>
  );
}

function BreakdownCard({
  title,
  description,
  items,
  emptyMessage,
}: BreakdownCardProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
      </div>

      {total === 0 ? (
        <div className="mt-5 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const width =
              maxValue > 0 ? Math.max((item.value / maxValue) * 100, 5) : 0;
            const percentage = formatPercent(item.value, total);

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink">
                    {item.label}
                  </span>
                  <span className="shrink-0 font-semibold text-muted">
                    {item.value}
                    {percentage ? (
                      <span className="ml-1 font-medium">({percentage})</span>
                    ) : null}
                  </span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${
                      fillClasses[item.tone ?? 'primary']
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CapacityCard({ stats }: { stats: OverviewStats }) {
  const total = stats.capacity.totalSlots;
  const claimed = stats.capacity.claimedSlots;
  const remaining = stats.capacity.remainingSlots;
  const claimedPercent = formatPercent(claimed, total);
  const remainingPercent = formatPercent(remaining, total);

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-ink">Capacity usage</h2>
        <p className="mt-1 text-sm leading-5 text-muted">
          Claimed and remaining slots based on workshop capacity.
        </p>
      </div>

      {total === 0 ? (
        <div className="mt-5 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
          No workshop capacity has been configured yet.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="h-3 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${claimedPercent ?? '0%'}` }}
            />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-surface-muted px-3 py-2">
              <p className="font-medium text-muted">Claimed slots</p>
              <p className="mt-1 font-semibold text-ink">
                {claimed} claimed of {total} total slots
                {claimedPercent ? ` (${claimedPercent})` : ''}
              </p>
            </div>
            <div className="rounded-md bg-surface-muted px-3 py-2">
              <p className="font-medium text-muted">Remaining slots</p>
              <p className="mt-1 font-semibold text-ink">
                {remaining} slots remaining across all workshops
                {remainingPercent ? ` (${remainingPercent})` : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function QuickActions() {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          className="inline-flex rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary/90"
          to="/organizer/workshops/new"
        >
          Create workshop
        </Link>
        <Link
          className="inline-flex rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
          to="/organizer/workshops"
        >
          Manage workshops
        </Link>
        <Link
          className="inline-flex rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
          to="/organizer/students/import"
        >
          Import students
        </Link>
        <Link
          className="inline-flex rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
          to="/organizer/student-sync"
        >
          Student sync
        </Link>
      </div>
    </section>
  );
}

function buildKpiCards(stats: OverviewStats): KpiCardProps[] {
  const openWorkshopPercent = formatPercent(
    stats.workshops.open,
    stats.workshops.total,
  );
  const confirmedRegistrationPercent = formatPercent(
    stats.registrations.confirmed,
    stats.registrations.total,
  );
  const claimedCapacityPercent = formatPercent(
    stats.capacity.claimedSlots,
    stats.capacity.totalSlots,
  );

  return [
    {
      label: 'Total students',
      value: String(stats.users.students),
      hint: 'Imported or synced student accounts.',
      status: stats.users.students === 0 ? 'Import students to start' : undefined,
      to: '/organizer/students',
    },
    {
      label: 'Open workshops',
      value: String(stats.workshops.open),
      hint: 'Currently accepting registrations.',
      status: openWorkshopPercent
        ? `${openWorkshopPercent} of all workshops`
        : 'No workshops yet',
      to: '/organizer/workshops',
    },
    {
      label: 'Confirmed registrations',
      value: String(stats.registrations.confirmed),
      hint: 'Confirmed seats across workshops.',
      status: confirmedRegistrationPercent
        ? `${confirmedRegistrationPercent} of all registrations`
        : 'No registrations yet',
    },
    {
      label: 'Capacity usage',
      value:
        stats.capacity.totalSlots > 0
          ? `${stats.capacity.claimedSlots} claimed`
          : '0 claimed',
      hint:
        stats.capacity.totalSlots > 0
          ? `${stats.capacity.claimedSlots} claimed of ${stats.capacity.totalSlots} total slots`
          : 'No workshop capacity configured.',
      status:
        stats.capacity.totalSlots > 0
          ? `${stats.capacity.remainingSlots} slots remaining across all workshops`
          : claimedCapacityPercent
            ? `${claimedCapacityPercent} claimed`
            : undefined,
      to: '/organizer/workshops',
    },
  ];
}

function buildOperationalNotes(stats: OverviewStats) {
  const notes = [
    `${stats.workshops.open} open workshops currently accepting registrations.`,
    `${stats.workshops.draft} draft workshops may need review before publishing.`,
    stats.capacity.totalSlots > 0
      ? `${stats.capacity.remainingSlots} remaining slots available across all workshops.`
      : 'No workshop capacity configured yet.',
    `${stats.registrations.pending} pending registrations need confirmation.`,
  ];

  return notes;
}

export function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStats() {
    setIsLoading(true);
    setError('');

    try {
      const result = await getOverviewStats();
      setStats(result);
      setLastUpdatedAt(new Date());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load organizer overview.'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  const hasData =
    stats &&
    (stats.users.total > 0 ||
      stats.workshops.total > 0 ||
      stats.registrations.total > 0 ||
      stats.capacity.totalSlots > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Organizer Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Live operational snapshot of students, workshops, registrations, and
            capacity.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <button
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            aria-busy={isLoading}
            type="button"
            onClick={() => void loadStats()}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          {lastUpdatedAt ? (
            <p className="text-xs font-medium text-muted">
              Last updated {formatTime(lastUpdatedAt)}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="rounded-lg border border-border bg-surface p-5 shadow-card"
              key={index}
            >
              <div className="h-3 w-28 rounded bg-surface-muted" />
              <div className="mt-5 h-9 w-20 rounded bg-surface-muted" />
              <div className="mt-4 h-4 w-full rounded bg-surface-muted" />
              <div className="mt-2 h-4 w-32 rounded bg-surface-muted" />
            </div>
          ))}
        </section>
      ) : null}

      {!isLoading && !error && !hasData ? (
        <>
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted shadow-card">
            No dashboard data is available yet. Import students or create workshops to
            start building the operational view.
          </div>
          <QuickActions />
        </>
      ) : null}

      {!isLoading && !error && hasData && stats ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {buildKpiCards(stats).map((card) => (
              <KpiCard key={card.label} {...card} />
            ))}
          </section>

          <QuickActions />

          <section className="grid gap-4 xl:grid-cols-2">
            <BreakdownCard
              description="Students, organizers, and check-in staff in the system."
              emptyMessage="No users are available in the current snapshot."
              items={[
                { label: 'Students', value: stats.users.students, tone: 'primary' },
                { label: 'Organizers', value: stats.users.organizers, tone: 'muted' },
                {
                  label: 'Check-in staff',
                  value: stats.users.checkinStaff,
                  tone: 'muted',
                },
              ]}
              title="Users by role"
            />
            <BreakdownCard
              description="Current lifecycle state of all workshops."
              emptyMessage="No workshops have been created yet."
              items={[
                { label: 'Open', value: stats.workshops.open, tone: 'success' },
                { label: 'Draft', value: stats.workshops.draft, tone: 'muted' },
                { label: 'Completed', value: stats.workshops.completed, tone: 'primary' },
                {
                  label: 'Cancelled',
                  value: stats.workshops.cancelled,
                  tone: 'warning',
                },
              ]}
              title="Workshops by status"
            />
            <BreakdownCard
              description="Current state of workshop registration records."
              emptyMessage="No registrations have been recorded yet."
              items={[
                {
                  label: 'Confirmed',
                  value: stats.registrations.confirmed,
                  tone: 'success',
                },
                { label: 'Pending', value: stats.registrations.pending, tone: 'warning' },
                {
                  label: 'Cancelled',
                  value: stats.registrations.cancelled,
                  tone: 'muted',
                },
              ]}
              title="Registrations by status"
            />
            <CapacityCard stats={stats} />
          </section>

          <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">Operational notes</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {buildOperationalNotes(stats).map((note) => (
                <p
                  className="rounded-md bg-surface-muted px-3 py-2 text-sm leading-5 text-muted"
                  key={note}
                >
                  {note}
                </p>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
