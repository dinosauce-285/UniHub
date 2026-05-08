import { ChangeEvent, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { importStudentsCsv } from '../../lib/studentsApi';
import type { StudentImportResult } from '../../types/students';
import { getApiErrorMessage } from '../../utils/errors';

export function StudentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<StudentImportResult | null>(null);
  const [error, setError] = useState('');

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setResult(null);
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError('Choose a CSV file before uploading.');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      setResult(await importStudentsCsv(file));
    } catch (uploadError) {
      setError(
        getApiErrorMessage(uploadError, 'Unable to import students right now.'),
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Student import</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Upload a CSV to create student accounts.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted"
          to="/organizer/students"
        >
          Back to students
        </Link>
      </div>

      <form
        className="rounded-lg border border-border bg-surface p-6 shadow-card"
        onSubmit={handleSubmit}
      >
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-ink">Upload CSV</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Choose a CSV file containing student account records. The existing
            import validation and duplicate handling will be applied.
          </p>
        </div>

        <div className="mt-5">
          <label
            className="block text-sm font-medium text-ink"
            htmlFor="student-csv"
          >
            CSV file
          </label>
          <input
            accept=".csv,text/csv"
            className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast hover:file:opacity-90"
            disabled={isUploading}
            id="student-csv"
            type="file"
            onChange={handleFileChange}
          />
          <p className="mt-2 text-xs leading-5 text-muted">
            CSV files only. Import behavior and validation are unchanged.
          </p>
        </div>

        <button
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </form>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <section className="rounded-lg border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Import result</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Review the account creation outcome before returning to the student
                list.
              </p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
              to="/organizer/students"
            >
              View students
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <p className="text-sm font-medium">Created accounts</p>
              <p className="mt-2 text-3xl font-semibold">{result.created}</p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-700">
              <p className="text-sm font-medium">Skipped rows</p>
              <p className="mt-2 text-3xl font-semibold">{result.skipped}</p>
            </div>
          </div>

          {result.errors.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink">Row error review</h3>
              <ul className="mt-3 space-y-2 text-sm text-red-700">
                {result.errors.map((message) => (
                  <li
                    className="rounded-md border border-red-100 bg-red-50 px-3 py-2"
                    key={message}
                  >
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-5 rounded-md bg-surface-muted px-3 py-2 text-sm text-muted">
              No row errors were reported.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
