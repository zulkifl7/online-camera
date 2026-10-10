import Link from "next/link";

export function BrandBar({ compact = false, linked = true }: { compact?: boolean; linked?: boolean }) {
  const logo = (
    <img src="/brand/cyrus-crew-logo.png" alt="Cyrus Crew" className={compact ? "h-9 w-auto" : "h-11 w-auto"} />
  );

  return (
    <header className="bg-brand text-white">
      <div className={`mx-auto flex max-w-6xl items-center px-4 ${compact ? "h-14" : "h-16"}`}>
        {linked ? (
          <Link href="/" className="inline-flex items-center rounded-sm">
            {logo}
          </Link>
        ) : (
          <div className="inline-flex items-center">{logo}</div>
        )}
      </div>
    </header>
  );
}
