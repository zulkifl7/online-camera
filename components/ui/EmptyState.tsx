import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children ? <div className="mt-2 text-sm leading-6 text-muted">{children}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-8 text-center" role="alert">
      <p className="text-sm text-ink">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold text-primary-hover">
          Try again
        </button>
      ) : null}
    </div>
  );
}
