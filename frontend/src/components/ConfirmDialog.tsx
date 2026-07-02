import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { btn, modalOverlay, modalPanel } from "@/components/ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  confirmLoading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmLoading = false,
  loadingLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className={modalOverlay} onClick={onCancel} aria-hidden="true" />
      <div className={modalPanel}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-semibold">
              {title}
            </h2>
            <div className="mt-1 text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={btn.ghost}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading}
            className={btn.danger}
          >
            {confirmLoading && loadingLabel ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
