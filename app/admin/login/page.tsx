"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandBar } from "@/components/brand/BrandBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { api, ApiError, fieldError } from "@/lib/api";
import type { AdminProfile, Envelope } from "@/lib/types";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<Envelope<AdminProfile>>("/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace("/admin");
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-page">
      <BrandBar />
      <main className="mx-auto max-w-md px-4 py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-ink">Admin sign in</h1>
          <p className="mt-2 text-sm leading-6 text-muted">This entrance is separate from the couple&apos;s gallery.</p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} error={fieldError(error, "email")} required />
            <TextField label="Password" allowVisibilityToggle autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {error instanceof ApiError ? <p className="text-sm text-danger" role="alert">{error.message}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in..." : "Log in"}</Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
