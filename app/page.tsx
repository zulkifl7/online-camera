import Link from "next/link";
import { BrandBar } from "@/components/brand/BrandBar";

export default function HomePage() {
  return (
    <div className="min-h-full bg-page">
      <BrandBar />
      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-12">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Online Camera</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted">
            Guests capture photos from a QR camera link. Couples sign in to a private gallery. Those two experiences stay separate.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold">Your photo gallery</h2>
            <p className="mt-2 text-sm leading-6 text-muted">For the couple. Sign in with the username and temporary password from Cyrus Crew.</p>
            <Link href="/client/login" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
              Client log in
            </Link>
          </section>
          <section className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold">Admin</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Create clients, event camera links, and recover hidden photos.</p>
            <Link href="/admin/login" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink">
              Admin log in
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
