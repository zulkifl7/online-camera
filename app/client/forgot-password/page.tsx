import Link from "next/link";
import { BrandBar } from "@/components/brand/BrandBar";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-full bg-page">
      <BrandBar />
      <main className="mx-auto max-w-md px-4 py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-ink">Password help</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Cyrus Crew can reset the gallery password. The current password cannot be looked up. Ask your coordinator for a new temporary password, then sign in and choose a new one.
          </p>
          <Link href="/client/login" className="mt-5 inline-block text-sm font-semibold text-primary-hover">
            Back to log in
          </Link>
        </Card>
      </main>
    </div>
  );
}
