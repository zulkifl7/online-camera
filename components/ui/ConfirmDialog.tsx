import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = "primary",
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 sm:items-center" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-floating outline-none"
      >
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-6 text-muted">{children}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
