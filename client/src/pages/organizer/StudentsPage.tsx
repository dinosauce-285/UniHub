import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getStudentDetail,
  listStudents,
  type ListStudentsParams,
} from '../../lib/studentsApi';
import type { Student, StudentListResponse } from '../../types/students';
import { getApiErrorMessage } from '../../utils/errors';

const defaultQuery: ListStudentsParams = {
  page: 1,
  limit: 20,
  search: '',
};

function formatStudentDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StudentDetailDrawer({
  student,
  isLoading,
  error,
  onClose,
}: {
  student: Student | null;
  isLoading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close student details"
        className="absolute inset-0 h-full w-full bg-ink/20"
        type="button"
        onClick={onClose}
      />
      <aside
        aria-busy={isLoading}
        aria-labelledby="student-detail-title"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-full flex-col overflow-hidden bg-surface shadow-card sm:max-w-md sm:border-l sm:border-border"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Selected student
            </p>
            <h2
              className="mt-2 truncate text-xl font-semibold text-ink"
              id="student-detail-title"
            >
              {student?.name ?? 'Student profile'}
            </h2>
            {student ? (
              <span className="mt-3 inline-flex rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">
                {student.role}
              </span>
            ) : null}
          </div>
          <button
            aria-label="Close student details"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-32 rounded bg-surface-muted" />
              <div className="h-4 w-full rounded bg-surface-muted" />
              <div className="h-4 w-3/4 rounded bg-surface-muted" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : student ? (
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-ink">Identity</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-muted">Student ID</dt>
                    <dd className="mt-1 text-ink">
                      {student.studentId ?? 'Not set'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-ink">Contact</h3>
                <dl className="mt-3 text-sm">
                  <div>
                    <dt className="font-medium text-muted">Email</dt>
                    <dd className="mt-1 break-words text-ink">{student.email}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-ink">System info</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-muted">Role</dt>
                    <dd className="mt-1 text-ink">{student.role}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted">Created</dt>
                    <dd className="mt-1 text-ink">
                      {formatStudentDate(student.createdAt)}
                    </dd>
                  </div>
                </dl>
              </section>

              <details className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
                <summary className="cursor-pointer font-medium text-muted">
                  Technical info
                </summary>
                <dl className="mt-3">
                  <div>
                    <dt className="font-medium text-muted">Internal ID</dt>
                    <dd className="mt-1 break-all font-mono text-xs text-ink">
                      {student.id}
                    </dd>
                  </div>
                </dl>
              </details>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Select a student to view safe profile details.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

export function StudentsPage() {
  const [query, setQuery] = useState(defaultQuery);
  const [searchInput, setSearchInput] = useState('');
  const [response, setResponse] = useState<StudentListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setQuery((current) => ({
        ...current,
        page: 1,
        search: searchInput.trim(),
      }));
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    void loadStudents(query);
  }, [query]);

  async function loadStudents(nextQuery: ListStudentsParams) {
    setIsLoading(true);
    setError('');

    try {
      const result = await listStudents(nextQuery);
      setResponse(result);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load students right now.'));
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function openStudentDetail(studentId: string) {
    setSelectedStudentId(studentId);
    setSelectedStudent(null);
    setDetailError('');
    setIsDetailLoading(true);

    try {
      const result = await getStudentDetail(studentId);
      setSelectedStudent(result);
    } catch (loadError) {
      setDetailError(getApiErrorMessage(loadError, 'Unable to load student details.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeStudentDetail() {
    setSelectedStudentId(null);
    setSelectedStudent(null);
    setDetailError('');
    setIsDetailLoading(false);
  }

  function clearSearch() {
    setSearchInput('');
    setQuery((current) => ({
      ...current,
      page: 1,
      search: '',
    }));
  }

  function goToPage(page: number) {
    setQuery((current) => ({
      ...current,
      page,
    }));
  }

  const items = response?.items ?? [];
  const meta = response?.meta;
  const activeSearch = (query.search ?? '').trim();
  const isEmpty = !isLoading && !error && items.length === 0;
  const hasSelection = Boolean(selectedStudentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Students</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Browse synced and imported student accounts.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary/90"
          to="/organizer/students/import"
        >
          Import students
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold hover:bg-red-100"
              type="button"
              onClick={() => void loadStudents(query)}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="block w-full lg:max-w-md">
            <span className="text-sm font-medium text-ink">Search students</span>
            <input
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
              placeholder="Search name, email, or student ID"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:justify-end">
            <div className="text-sm text-muted">
              {meta ? (
                <>
                  <p>
                    Showing page {meta.page} of {meta.totalPages} - {meta.total}{' '}
                    students
                  </p>
                  {activeSearch ? (
                    <p className="mt-1">Results for "{activeSearch}"</p>
                  ) : null}
                </>
              ) : (
                <p>Loading student results</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {searchInput ? (
                <button
                  className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
                  type="button"
                  onClick={clearSearch}
                >
                  Clear search
                </button>
              ) : null}
              <button
                className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!meta || meta.page <= 1 || isLoading}
                type="button"
                onClick={() => meta && goToPage(Math.max(meta.page - 1, 1))}
              >
                Previous
              </button>
              <button
                className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!meta || meta.page >= meta.totalPages || isLoading}
                type="button"
                onClick={() =>
                  meta && goToPage(Math.min(meta.page + 1, meta.totalPages))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4" colSpan={5}>
                        <div className="h-4 rounded bg-surface-muted" />
                      </td>
                    </tr>
                  ))
                ) : isEmpty ? (
                  <tr>
                    <td className="px-4 py-8 text-muted" colSpan={5}>
                      {activeSearch
                        ? 'No students match this search.'
                        : 'No students yet.'}
                    </td>
                  </tr>
                ) : (
                  items.map((student) => {
                    const isSelected = selectedStudentId === student.id;

                    return (
                      <tr
                        aria-selected={isSelected}
                        className={
                          isSelected
                            ? 'bg-primary/10 text-ink ring-1 ring-inset ring-primary/30'
                            : 'text-ink hover:bg-surface-muted/70'
                        }
                        key={student.id}
                      >
                        <td className="px-4 py-4">
                          <div className="font-semibold">{student.name}</div>
                          <div className="mt-1 text-xs font-medium text-muted">
                            Student
                          </div>
                        </td>
                        <td className="max-w-xs break-words px-4 py-4">
                          {student.email}
                        </td>
                        <td className="px-4 py-4">
                          {student.studentId ?? 'Not set'}
                        </td>
                        <td className="px-4 py-4">
                          {formatStudentDate(student.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            className={`rounded-md border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface ${
                              isSelected
                                ? 'border-primary bg-surface'
                                : 'border-border'
                            }`}
                            type="button"
                            onClick={() => void openStudentDetail(student.id)}
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="rounded-lg border border-border bg-surface p-4"
                  key={index}
                >
                  <div className="h-4 w-36 rounded bg-surface-muted" />
                  <div className="mt-3 h-4 w-full rounded bg-surface-muted" />
                  <div className="mt-4 h-16 rounded bg-surface-muted" />
                </div>
              ))
            ) : isEmpty ? (
              <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                {activeSearch ? (
                  <>
                    <p>No students match this search.</p>
                    <button
                      className="mt-3 rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
                      type="button"
                      onClick={clearSearch}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <p>No students yet.</p>
                    <Link
                      className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary/90"
                      to="/organizer/students/import"
                    >
                      Import students
                    </Link>
                  </>
                )}
              </div>
            ) : (
              items.map((student) => {
                const isSelected = selectedStudentId === student.id;

                return (
                  <article
                    aria-current={isSelected ? 'true' : undefined}
                    className={`rounded-lg border p-4 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-card ring-1 ring-inset ring-primary/30'
                        : 'border-border bg-surface'
                    }`}
                    key={student.id}
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-ink">
                        {student.name}
                      </h2>
                      <p className="mt-1 break-words text-sm text-muted">
                        {student.email}
                      </p>
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="font-medium text-muted">Student ID</dt>
                        <dd className="text-right text-ink">
                          {student.studentId ?? 'Not set'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-medium text-muted">Created</dt>
                        <dd className="text-right text-ink">
                          {formatStudentDate(student.createdAt)}
                        </dd>
                      </div>
                    </dl>
                    <button
                      className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
                      type="button"
                      onClick={() => void openStudentDetail(student.id)}
                    >
                      View details
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {hasSelection ? (
        <StudentDetailDrawer
          error={detailError}
          isLoading={isDetailLoading}
          student={selectedStudent}
          onClose={closeStudentDetail}
        />
      ) : null}

      {isEmpty && !activeSearch ? (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-muted shadow-card md:hidden">
          Import a CSV to create student accounts, then return here to browse them.
        </div>
      ) : null}
    </div>
  );
}
