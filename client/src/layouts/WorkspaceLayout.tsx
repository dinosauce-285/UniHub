import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { roleHome } from '../components/ProtectedRoute';
import type { Role } from '../types/auth';

const roleLabels: Record<Role, string> = {
  STUDENT: 'Student',
  ORGANIZER: 'Organizer',
  CHECKIN_STAFF: 'Check-in staff',
};

export function WorkspaceLayout({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();

  return (
    <main className="app-shell min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link className="text-lg font-semibold text-ink" to={roleHome(role)}>
            UniHub
          </Link>
          <div className="flex items-center gap-6">
            {role === 'ORGANIZER' && (
              <nav className="flex gap-4 text-sm font-medium">
                <Link className="text-muted hover:text-ink" to="/organizer">
                  Students (CSV)
                </Link>
                <Link className="text-muted hover:text-ink" to="/organizer/workshops">
                  Workshops (AI)
                </Link>
              </nav>
            )}
            <div className="flex items-center gap-3 border-l border-border pl-6">
              <span className="rounded-md bg-surface-muted px-3 py-1 text-sm text-muted">
                {user?.name} - {roleLabels[role]}
              </span>
              <button
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                type="button"
                onClick={logout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        {children}
      </section>
    </main>
  );
}

export function RoleWorkspacePlaceholder({ role }: { role: Role }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        {roleLabels[role]} workspace
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">
        Authentication is active
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        This route is protected by local auth state and only renders for the
        matching role. API requests now include the JWT bearer token.
      </p>
    </div>
  );
}
