import { ChangeEvent, FormEvent, useState } from 'react';
import { importStudentsCsv } from '../../lib/studentsApi';
import type { StudentImportResult } from '../../types/students';
import { getApiErrorMessage } from '../../utils/errors';

export function StudentsPage() {
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
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Student import
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Upload student CSV
        </h1>
      </div>

      <form
        className="rounded-lg border border-border bg-surface p-6 shadow-card"
        onSubmit={handleSubmit}
      >
        <label className="block text-sm font-medium text-ink" htmlFor="student-csv">
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

        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
          <h2 className="text-lg font-semibold text-ink">Import result</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-emerald-50 p-4 text-emerald-700">
              <p className="text-sm font-medium">Created</p>
              <p className="mt-1 text-2xl font-semibold">{result.created}</p>
            </div>
            <div className="rounded-md bg-amber-50 p-4 text-amber-700">
              <p className="text-sm font-medium">Skipped</p>
              <p className="mt-1 text-2xl font-semibold">{result.skipped}</p>
            </div>
          </div>

          {result.errors.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-ink">Row errors</h3>
              <ul className="mt-2 space-y-2 text-sm text-red-700">
                {result.errors.map((message) => (
                  <li className="rounded-md bg-red-50 px-3 py-2" key={message}>
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
