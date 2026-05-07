export type ToastVariant = 'success' | 'warning';

export type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const toastStyles: Record<ToastVariant, string> = {
  success: 'border-success/40 bg-success text-primary-contrast',
  warning: 'border-warning/40 bg-warning text-ink',
};

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState | null;
  onDismiss: () => void;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div
        className={`flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm shadow-card ${toastStyles[toast.variant]}`}
        role="status"
      >
        <p className="leading-5">{toast.message}</p>
        <button
          className="shrink-0 rounded border border-current/30 px-2 py-0.5 text-xs font-semibold hover:bg-surface/20"
          type="button"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
