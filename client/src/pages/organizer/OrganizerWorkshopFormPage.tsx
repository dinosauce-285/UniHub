import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createWorkshop,
  generateWorkshopDescriptionFromPdf,
  listOrganizerWorkshops,
  updateWorkshop,
  updateWorkshopStatus,
  uploadWorkshopRoomMap,
  type WorkshopPayload,
} from '../../lib/workshopsApi';
import type { Workshop, WorkshopStatus } from '../../types/registration';
import { getApiErrorMessage } from '../../utils/errors';

type WorkshopFormState = {
  title: string;
  description: string;
  aiSummary: string;
  speaker: string;
  room: string;
  roomMapUrl: string;
  startTime: string;
  endTime: string;
  totalSlots: string;
  status: WorkshopStatus;
  isPaid: boolean;
  price: string;
};

const blankForm: WorkshopFormState = {
  title: '',
  description: '',
  aiSummary: '',
  speaker: '',
  room: '',
  roomMapUrl: '',
  startTime: '',
  endTime: '',
  totalSlots: '60',
  status: 'DRAFT',
  isPaid: false,
  price: '0',
};

const statuses: WorkshopStatus[] = ['DRAFT', 'OPEN', 'CANCELLED', 'COMPLETED'];
const MAX_AI_PDF_SIZE_BYTES = 10 * 1024 * 1024;

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromWorkshop(workshop: Workshop): WorkshopFormState {
  return {
    title: workshop.title,
    description: workshop.description,
    aiSummary: workshop.aiSummary ?? '',
    speaker: workshop.speaker,
    room: workshop.room,
    roomMapUrl: workshop.roomMapUrl ?? '',
    startTime: toDateTimeLocal(workshop.startTime),
    endTime: toDateTimeLocal(workshop.endTime),
    totalSlots: String(workshop.totalSlots),
    status: workshop.status,
    isPaid: workshop.isPaid,
    price: String(workshop.price),
  };
}

function toPayload(form: WorkshopFormState): WorkshopPayload {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    aiSummary: form.aiSummary.trim() || null,
    speaker: form.speaker.trim(),
    room: form.room.trim(),
    roomMapUrl: form.roomMapUrl.trim() || null,
    startTime: new Date(form.startTime).toISOString(),
    endTime: new Date(form.endTime).toISOString(),
    totalSlots: Number(form.totalSlots),
    status: form.status,
    isPaid: form.isPaid,
    price: form.isPaid ? Number(form.price) : 0,
  };
}

export function OrganizerWorkshopFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [form, setForm] = useState<WorkshopFormState>(blankForm);
  const [initialWorkshop, setInitialWorkshop] = useState<Workshop | null>(null);
  const [roomMapFile, setRoomMapFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState('');
  const [aiSummarySuccess, setAiSummarySuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadWorkshop() {
      if (!id) {
        return;
      }

      try {
        setIsLoading(true);
        const workshops = await listOrganizerWorkshops();
        const workshop = workshops.find((item) => item.id === id);

        if (!workshop) {
          throw new Error('Workshop not found');
        }

        if (isMounted) {
          setInitialWorkshop(workshop);
          setForm(fromWorkshop(workshop));
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err, 'Failed to load workshop'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWorkshop();

    return () => {
      isMounted = false;
    };
  }, [id]);

  function updateForm<Field extends keyof WorkshopFormState>(
    field: Field,
    value: WorkshopFormState[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateAiPdfFile(file: File) {
    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const hasPdfType = file.type === 'application/pdf' || file.type === '';

    if (!hasPdfExtension || !hasPdfType) {
      return 'Select a PDF file. Other document types are not supported.';
    }

    if (file.size > MAX_AI_PDF_SIZE_BYTES) {
      return 'Select a PDF that is 10 MB or smaller.';
    }

    return '';
  }

  async function generateAiSummaryFromPdf(file: File) {
    setIsGeneratingAiSummary(true);
    setAiSummaryError('');
    setAiSummarySuccess('');

    try {
      const result = await generateWorkshopDescriptionFromPdf(file);
      updateForm('aiSummary', result.summary);
      setAiSummarySuccess('AI summary generated from the PDF.');
    } catch (err) {
      setAiSummaryError(
        getApiErrorMessage(err, 'Failed to generate an AI summary from this PDF'),
      );
    } finally {
      setIsGeneratingAiSummary(false);
    }
  }

  function handleAiPdfChange(file: File | undefined) {
    setAiSummaryError('');
    setAiSummarySuccess('');

    if (!file) {
      return;
    }

    const validationMessage = validateAiPdfFile(file);

    if (validationMessage) {
      setAiSummaryError(validationMessage);
      return;
    }

    void generateAiSummaryFromPdf(file);
  }

  function handleUseAiSummaryAsDescription() {
    const summary = form.aiSummary.trim();
    if (!summary) {
      return;
    }

    updateForm('description', summary);
    setAiSummarySuccess('Description replaced with the AI summary.');
  }

  function handleAppendAiSummaryToDescription() {
    const summary = form.aiSummary.trim();
    if (!summary) {
      return;
    }

    const description = form.description.trim();
    updateForm('description', description ? `${description}\n\n${summary}` : summary);
    setAiSummarySuccess('AI summary appended to the description.');
  }

  function handleClearAiSummary() {
    updateForm('aiSummary', '');
    setAiSummaryError('');
    setAiSummarySuccess('AI summary cleared.');
  }


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const payload = toPayload(form);
      let saved: Workshop;

      if (isEditMode && id) {
        const selectedStatus = form.status;
        const { status: _status, ...updatePayload } = payload;
        saved = await updateWorkshop(id, updatePayload);

        if (initialWorkshop && initialWorkshop.status !== selectedStatus) {
          saved = await updateWorkshopStatus(id, selectedStatus);
        }
      } else {
        saved = await createWorkshop(payload);
      }

      if (roomMapFile) {
        const upload = await uploadWorkshopRoomMap(saved.id, roomMapFile);
        saved = upload.workshop;
      }

      navigate('/organizer/workshops');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save workshop'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Workshops
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            {isEditMode ? 'Edit workshop' : 'Create workshop'}
          </h1>
        </div>
        <Link
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted"
          to="/organizer/workshops"
        >
          Back to list
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
          Loading workshop...
        </p>
      ) : (
        <form
          className="grid gap-5 rounded-lg border border-border bg-surface p-6 shadow-card"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-ink">
              Title
              <input
                required
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Speaker
              <input
                required
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={form.speaker}
                onChange={(event) => updateForm('speaker', event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Room
              <input
                required
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={form.room}
                onChange={(event) => updateForm('room', event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Status
              <select
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={form.status}
                onChange={(event) =>
                  updateForm('status', event.target.value as WorkshopStatus)
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-ink">
              Start time
              <input
                required
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                type="datetime-local"
                value={form.startTime}
                onChange={(event) => updateForm('startTime', event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-ink">
              End time
              <input
                required
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                type="datetime-local"
                value={form.endTime}
                onChange={(event) => updateForm('endTime', event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Total slots
              <input
                required
                min="1"
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                type="number"
                value={form.totalSlots}
                onChange={(event) => updateForm('totalSlots', event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-ink">
              Price
              <input
                min="0"
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
                disabled={!form.isPaid}
                type="number"
                value={form.price}
                onChange={(event) => updateForm('price', event.target.value)}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              checked={form.isPaid}
              type="checkbox"
              onChange={(event) => updateForm('isPaid', event.target.checked)}
            />
            Paid workshop
          </label>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-ink">
              Description
              <span className="mt-1 block text-xs font-normal text-muted">
                Public description shown to students.
              </span>
              <textarea
                required
                className="mt-1 block min-h-32 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
              />
            </label>

            <div className="rounded-md border border-border bg-surface-muted p-4">
              <div className="grid gap-4">
                <label className="text-sm font-medium text-ink sm:flex-1">
                  AI Summary from PDF
                  <input
                    accept=".pdf,application/pdf"
                    className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast"
                    disabled={isGeneratingAiSummary}
                    type="file"
                    onChange={(event) => {
                      handleAiPdfChange(event.target.files?.[0]);
                    }}
                  />
                </label>

                <label className="text-sm font-medium text-ink">
                  AI Summary
                  <textarea
                    className="mt-1 block min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                    placeholder="Upload a PDF to generate a summary, or write one here."
                    value={form.aiSummary}
                    onChange={(event) => updateForm('aiSummary', event.target.value)}
                  />
                </label>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={!form.aiSummary.trim()}
                    type="button"
                    onClick={handleUseAiSummaryAsDescription}
                  >
                    {form.description.trim()
                      ? 'Replace description with AI summary'
                      : 'Use as description'}
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={!form.aiSummary.trim()}
                    type="button"
                    onClick={handleAppendAiSummaryToDescription}
                  >
                    Append to description
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={!form.aiSummary}
                    type="button"
                    onClick={handleClearAiSummary}
                  >
                    Clear AI summary
                  </button>
                </div>
              </div>

              {isGeneratingAiSummary ? (
                <p className="mt-3 text-sm text-muted">
                  Generating an AI summary from the PDF...
                </p>
              ) : null}
              {aiSummarySuccess ? (
                <p className="mt-3 text-sm text-emerald-700">
                  {aiSummarySuccess}
                </p>
              ) : null}
              {aiSummaryError ? (
                <p className="mt-3 text-sm text-red-700">{aiSummaryError}</p>
              ) : null}
            </div>
          </div>

          <label className="text-sm font-medium text-ink">
            Room map URL
            <input
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              placeholder="https://... or /api/uploads/room-maps/..."
              value={form.roomMapUrl}
              onChange={(event) => updateForm('roomMapUrl', event.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-ink">
            Upload room map
            <input
              accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast"
              type="file"
              onChange={(event) => setRoomMapFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted"
              to="/organizer/workshops"
            >
              Cancel
            </Link>
            <button
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? 'Saving...'
                : isEditMode
                  ? 'Save changes'
                  : 'Create workshop'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
