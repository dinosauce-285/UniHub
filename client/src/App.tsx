import { FormEvent, ReactNode, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuthStore } from './features/auth/useAuth';
import type { Role } from './features/auth/types';

const roleLabels: Record<Role, string> = {
  STUDENT: 'Student',
  ORGANIZER: 'Organizer',
  CHECKIN_STAFF: 'Check-in staff',
};

function roleHome(role: Role) {
  if (role === 'ORGANIZER') {
    return '/organizer';
  }

  if (role === 'CHECKIN_STAFF') {
    return '/checkin';
  }

  return '/student';
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null
  ) {
    const response = error.response as { status?: number };
    if (response.status === 401) {
      return 'Email or password is incorrect.';
    }
  }

  return 'Unable to sign in right now. Please try again.';
}

function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: ReactNode;
}) {
  const { accessToken, user } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuthStore();
  const [email, setEmail] = useState('student1@unihub.local');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter both email and password.');
      return;
    }

    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      const nextUser = useAuthStore.getState().user;
      const requestedPath =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : undefined;

      navigate(requestedPath ?? roleHome(nextUser?.role ?? 'STUDENT'), {
        replace: true,
      });
    } catch (authError) {
      setError(getErrorMessage(authError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            UniHub
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Use your seeded UniHub account to enter the matching workspace.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="password"
              value={password}
              minLength={8}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-ink">
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Workspace({ role }: { role: Role }) {
  const { user, logout } = useAuthStore();

  return (
    <main className="app-shell min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link className="text-lg font-semibold text-ink" to={roleHome(role)}>
            UniHub
          </Link>
          <div className="flex items-center gap-3">
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
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
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
      </section>
    </main>
  );
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? roleHome(user.role) : '/login'} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Workspace role="STUDENT" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <Workspace role="ORGANIZER" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkin"
        element={
          <ProtectedRoute allowedRoles={['CHECKIN_STAFF']}>
            <Workspace role="CHECKIN_STAFF" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
