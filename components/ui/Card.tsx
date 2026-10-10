import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-surface shadow-card ${className}`}>
      {children}
    </section>
  );
}
