import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { roleHome } from '../../components/ProtectedRoute';
import { getErrorMessage } from '../../utils/errors';

export function LoginPage() {
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
