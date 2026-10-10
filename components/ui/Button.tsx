import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-primary/50",
  secondary:
    "bg-surface text-ink border border-line hover:bg-subtle disabled:text-muted",
  danger:
    "bg-danger text-white hover:brightness-95 disabled:opacity-50",
  ghost: "bg-transparent text-ink hover:bg-subtle",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
