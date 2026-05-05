import { useEffect, useState } from 'react';
import { fetchStudentSyncLogs, triggerStudentSync } from '../../lib/studentSyncApi';
import type { StudentSyncLog } from '../../types/studentSync';
import { getApiErrorMessage } from '../../utils/errors';

export function StudentSyncPage() {
  const [logs, setLogs] = useState<StudentSyncLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadLogs() {
    setIsLoading(true);
    setError('');

    try {
      const result = await fetchStudentSyncLogs();
      setLogs(result.items);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load sync logs right now.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTriggerSync() {
    setIsTriggering(true);
    setNotice('');
    setError('');

    try {
      const result = await triggerStudentSync();
      setNotice(result.jobId ? `Sync job queued: ${result.jobId}` : 'Sync job queued.');
      await loadLogs();
    } catch (triggerError) {
      setError(getApiErrorMessage(triggerError, 'Unable to trigger student sync.'));
    } finally {
      setIsTriggering(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Student sync
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            Nightly legacy CSV sync
          </h1>
        </div>
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isTriggering}
          type="button"
          onClick={handleTriggerSync}
        >
          {isTriggering ? 'Queueing...' : 'Run sync now'}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Run date</th>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3 text-right">Rows</th>
                <th className="px-4 py-3 text-right">Imported</th>
                <th className="px-4 py-3 text-right">Errors</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={6}>
                    Loading sync logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={6}>
                    No sync runs have been recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr className="text-ink" key={log.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(log.runAt).toLocaleString()}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3" title={log.filename}>
                        {log.filename}
                      </td>
                      <td className="px-4 py-3 text-right">{log.totalRows}</td>
                      <td className="px-4 py-3 text-right">{log.imported}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            log.errors > 0
                              ? 'font-semibold text-red-700'
                              : 'font-semibold text-emerald-700'
                          }
                        >
                          {log.errors}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={log.errors === 0}
                          type="button"
                          onClick={() =>
                            setExpandedLogId(expandedLogId === log.id ? null : log.id)
                          }
                        >
                          {expandedLogId === log.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedLogId === log.id ? (
                      <tr key={`${log.id}-details`}>
                        <td className="bg-surface-muted px-4 py-4" colSpan={6}>
                          <pre className="max-h-72 overflow-auto rounded-md bg-surface p-3 text-xs leading-5 text-ink">
                            {JSON.stringify(log.errorDetails ?? [], null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
