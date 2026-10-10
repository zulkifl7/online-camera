export function ProgressBar({
  value,
  label,
  indeterminate = false,
}: {
  value?: number;
  label: string;
  indeterminate?: boolean;
}) {
  const determinate = !indeterminate && typeof value === "number";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={determinate ? Math.round(value) : undefined}
      className="h-1.5 overflow-hidden rounded-full bg-subtle"
    >
      <div
        className={`h-full rounded-full bg-primary ${indeterminate ? "w-1/3 animate-pulse" : ""}`}
        style={determinate ? { width: `${Math.max(0, Math.min(100, value))}%` } : undefined}
      />
    </div>
  );
}
