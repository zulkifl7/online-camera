"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandBar } from "@/components/brand/BrandBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { api, fieldError } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/v1/client/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: confirmation,
        }),
      });
      router.replace("/client/gallery");
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
          <h1 className="text-2xl font-semibold text-ink">Choose a new password</h1>
          <p className="mt-2 text-sm leading-6 text-muted">The temporary password only works until you replace it. Use at least 8 characters.</p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <TextField label="Temporary password" allowVisibilityToggle value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} error={fieldError(error, "current_password")} required />
            <TextField label="New password" allowVisibilityToggle value={password} onChange={(event) => setPassword(event.target.value)} error={fieldError(error, "password")} required />
            <TextField label="Confirm new password" allowVisibilityToggle value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            {error instanceof Error ? <p className="text-sm text-danger" role="alert">{error.message}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving..." : "Save password"}</Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
