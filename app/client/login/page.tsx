"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandBar } from "@/components/brand/BrandBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { api, ApiError, fieldError } from "@/lib/api";
import type { ClientProfile, Envelope } from "@/lib/types";

export default function ClientLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await api<Envelope<ClientProfile>>("/api/v1/client/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      router.replace(response.data.must_change_password ? "/client/change-password" : "/client/gallery");
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "";

  return (
    <div className="min-h-full bg-page">
      <BrandBar />
      <main className="mx-auto flex max-w-md flex-col px-4 py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-ink">Your photo gallery</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Sign in with the username and password provided by Cyrus Crew.</p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <TextField label="Username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} error={fieldError(error, "username")} required />
            <TextField label="Password" allowVisibilityToggle autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={fieldError(error, "password")} required />
            {message ? <p className="text-sm text-danger" role="alert">{message}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in..." : "Log in"}</Button>
          </form>
          <Link href="/client/forgot-password" className="mt-4 inline-block text-sm font-semibold text-primary-hover">
            Forgot password?
          </Link>
        </Card>
      </main>
    </div>
  );
}
