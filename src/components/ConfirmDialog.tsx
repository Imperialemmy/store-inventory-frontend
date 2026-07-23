import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  busy = false, onConfirm, onCancel,
}: ConfirmDialogProps) => {
  if (!open) return null;
  return (
    <div className="modal-overlay confirm-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm-card surface">
        <h3 className="confirm-card__title">{title}</h3>
        {message && <div className="confirm-card__body">{message}</div>}
        <div className="confirm-card__actions">
          <button type="button" className="button button--ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button type="button" className="button button--primary" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
