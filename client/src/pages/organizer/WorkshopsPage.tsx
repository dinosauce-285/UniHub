import { useEffect, useState } from 'react';
import { listOrganizerWorkshops, uploadWorkshopAiSummary } from '../../lib/workshopsApi';
import type { Workshop } from '../../types/registration';
import { getApiErrorMessage } from '../../utils/errors';

export function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkshops();
  }, []);

  async function loadWorkshops() {
    try {
      setLoading(true);
      const data = await listOrganizerWorkshops();
      setWorkshops(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load workshops'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePdfUpload(workshopId: string, file: File) {
    try {
      setUploadingId(workshopId);
      setError('');
      const result = await uploadWorkshopAiSummary(workshopId, file);
      if (result.queued) {
        // Optimistically reload or just show a message.
        // It might take time for the AI summary to be generated via BullMQ.
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
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Workshops
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Manage AI Summary
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {loading ? (
          <p className="text-sm text-muted">Loading workshops...</p>
        ) : (
          workshops.map((workshop) => (
            <div key={workshop.id} className="rounded-lg border border-border bg-surface p-6 shadow-card">
              <h2 className="text-lg font-semibold text-ink">{workshop.title}</h2>
              <p className="text-sm text-muted mt-1">{workshop.description}</p>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-ink">Upload PDF to generate AI Summary</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast hover:file:opacity-90 disabled:opacity-50"
                  disabled={uploadingId === workshop.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePdfUpload(workshop.id, file);
                    }
                  }}
                />
                {uploadingId === workshop.id && <p className="text-sm text-primary mt-2">Uploading PDF and queuing AI Summary...</p>}
              </div>

              {workshop.aiSummary ? (
                <div className="mt-4 rounded-md bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-ink">AI Summary</h3>
                  <p className="mt-2 text-sm text-muted whitespace-pre-wrap">{workshop.aiSummary}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-md bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">No AI summary generated yet.</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
