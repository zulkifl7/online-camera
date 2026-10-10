import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  allowVisibilityToggle?: boolean;
};

export function TextField({ label, hint, error, allowVisibilityToggle = false, id, className = "", type = "text", ...props }: TextFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const [visible, setVisible] = useState(false);
  const inputType = allowVisibilityToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`min-h-11 w-full rounded-md border bg-surface px-3 text-base text-ink outline-none placeholder:text-muted ${error ? "border-danger" : "border-line"} ${allowVisibilityToggle ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {allowVisibilityToggle ? (
          <button
            type="button"
            className="absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
