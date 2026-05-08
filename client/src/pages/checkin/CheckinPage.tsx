import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { syncCheckins, validateCheckin } from '../../lib/checkinApi';
import type { CheckinResult, PendingCheckin } from '../../types/checkin';
import { getApiErrorMessage } from '../../utils/errors';
import {
  addPendingCheckin,
  getDeviceId,
  listPendingCheckins,
  removePendingCheckins,
} from '../../utils/pendingCheckinsDb';
import { Toast, ToastState } from '../../components/Toast';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export function CheckinPage() {
  const { isOnline } = useOfflineSync();
  const [qrCode, setQrCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pending, setPending] = useState<PendingCheckin[]>([]);
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastScannedRef = useRef('');
  const scannerLockedRef = useRef(false);
  const deviceId = useMemo(() => getDeviceId(), []);

  const showToast = useCallback((message: string, variant: ToastState['variant']) => {
    setToast({ id: Date.now(), message, variant });
  }, []);

  const refreshPending = useCallback(async () => {
    setPending(await listPendingCheckins());
  }, []);

  const handleSync = useCallback(async () => {
    const records = await listPendingCheckins();
    if (!records.length || isSyncing || !navigator.onLine) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncCheckins(records);
      await removePendingCheckins(records.map((record) => record.id));
      await refreshPending();
      showToast(
        `Synced ${result.synced}; duplicates ${result.duplicates}; rejected ${result.rejected}.`,
        result.rejected ? 'warning' : 'success',
      );
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to sync offline check-ins.'), 'warning');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPending, showToast]);

  const submitQr = useCallback(
    async (rawQrCode: string) => {
      const value = rawQrCode.trim();
      if (!value || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      setLastResult(null);

      try {
        if (navigator.onLine) {
          const result = await validateCheckin(value, deviceId);
          setLastResult(result);
          showToast(
            result.alreadyCheckedIn
              ? `${result.student.name} was already checked in.`
              : `Checked in ${result.student.name}.`,
            result.alreadyCheckedIn ? 'warning' : 'success',
          );
        } else {
          await addPendingCheckin(value, deviceId);
          await refreshPending();
          showToast('Saved offline. It will sync when the network returns.', 'success');
        }

        setQrCode('');
      } catch (error) {
        showToast(getApiErrorMessage(error, 'Unable to validate this QR code.'), 'warning');
      } finally {
        setIsSubmitting(false);
      }
    },
    [deviceId, isSubmitting, refreshPending, showToast],
  );

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    if (isOnline) {
      handleSync();
    }
  }, [handleSync, isOnline]);

  useEffect(() => {
    let stopped = false;
    let controls: IScannerControls | null = null;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is unavailable in this browser. Enter the QR code manually.');
        return;
      }

      try {
        const reader = new BrowserMultiFormatReader();

        if (!videoRef.current) {
          setCameraError('Camera preview is unavailable. Enter the QR code manually.');
          return;
        }

        setIsCameraActive(true);

        controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
            },
          },
          videoRef.current,
          async (result) => {
            if (stopped || !result) {
              return;
            }

            const rawValue = result.getText().trim();
            if (
              !rawValue ||
              scannerLockedRef.current ||
              rawValue === lastScannedRef.current
            ) {
              return;
            }

            scannerLockedRef.current = true;
            lastScannedRef.current = rawValue;
            try {
              await submitQr(rawValue);
            } finally {
              window.setTimeout(() => {
                lastScannedRef.current = '';
                scannerLockedRef.current = false;
              }, 2500);
            }
          },
        );
      } catch {
        setCameraError('Camera permission was denied or no camera is available. Enter the QR code manually.');
        setIsCameraActive(false);
      }
    }

    startCamera();

    return () => {
      stopped = true;
      scannerLockedRef.current = false;
      controls?.stop();
      setIsCameraActive(false);
    };
  }, [submitQr]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQr(qrCode);
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Door check-in
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            Scan workshop QR codes
          </h1>
        </div>
        <div
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
          <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-950">
            <video
              className="h-full w-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>{isCameraActive ? 'Camera active' : 'Camera standby'}</span>
            {cameraError ? <span className="text-warning">{cameraError}</span> : null}
          </div>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
              placeholder="Paste or type QR code"
              value={qrCode}
              onChange={(event) => setQrCode(event.target.value)}
            />
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Checking...' : 'Check in'}
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink">Offline queue</h2>
              <span className="rounded-md bg-surface-muted px-2 py-1 text-sm text-muted">
                {pending.length}
              </span>
            </div>
            <button
              className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!pending.length || isSyncing || !isOnline}
              type="button"
              onClick={handleSync}
            >
              {isSyncing ? 'Syncing...' : 'Sync now'}
            </button>

            <ul className="mt-4 max-h-56 space-y-2 overflow-auto text-sm">
              {pending.map((record) => (
                <li className="rounded-md bg-surface-muted px-3 py-2" key={record.id}>
                  <p className="truncate font-medium text-ink">{record.qrCode}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(record.checkedInAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {!pending.length ? (
                <li className="rounded-md bg-surface-muted px-3 py-2 text-muted">
                  No pending check-ins.
                </li>
              ) : null}
            </ul>
          </div>

          {lastResult ? (
            <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
              <h2 className="text-base font-semibold text-ink">Last check-in</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Student</dt>
                  <dd className="font-medium text-ink">{lastResult.student.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Workshop</dt>
                  <dd className="font-medium text-ink">{lastResult.workshop.title}</dd>
                </div>
                <div>
                  <dt className="text-muted">Room</dt>
                  <dd className="font-medium text-ink">{lastResult.workshop.room}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
