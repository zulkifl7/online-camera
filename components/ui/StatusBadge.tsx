const tones: Record<string, string> = {
  active: "bg-primary-soft text-success",
  ready: "bg-primary-soft text-success",
  paused: "bg-amber-50 text-warning",
  processing: "bg-subtle text-muted",
  pending: "bg-subtle text-muted",
  queued: "bg-subtle text-muted",
  revoked: "bg-red-50 text-danger",
  failed: "bg-red-50 text-danger",
  hidden: "bg-subtle text-ink",
  suspended: "bg-amber-50 text-warning",
  archived: "bg-subtle text-muted",
  common: "bg-primary-soft text-success",
  event: "bg-subtle text-ink",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = tones[status] ?? "bg-subtle text-ink";
  const label = status.replaceAll("_", " ");

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>
      {label}
    </span>
  );
}
