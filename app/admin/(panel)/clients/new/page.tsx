"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { api, fieldError } from "@/lib/api";
import type { ClientAccount, Envelope } from "@/lib/types";

type Created = {
  client: ClientAccount;
  temporary_password: string;
  common_camera_url: string;
  client_login_url: string;
};

export default function NewClientPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await api<Envelope<Created>>("/api/v1/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          display_name: displayName,
          email: email || null,
          phone: phone || null,
        }),
      });
      sessionStorage.setItem(
        `cc-provision-${response.data.client.id}`,
        JSON.stringify({
          username: response.data.client.username,
          temporary_password: response.data.temporary_password,
        }),
      );
      router.replace(`/admin/clients/${response.data.client.id}`);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Create client</h1>
        <p className="mt-2 text-sm leading-6 text-muted">This also creates the Common Gallery, a temporary password, and the Common Camera link.</p>
      </div>
      <Card className="p-5">
        <form onSubmit={submit} className="grid gap-4">
          <TextField label="Couple name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} error={fieldError(error, "display_name")} required />
          <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} hint="Optional. Not shown to guests." error={fieldError(error, "email")} />
          <TextField label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} hint="Optional." error={fieldError(error, "phone")} />
          {error instanceof Error ? <p className="text-sm text-danger" role="alert">{error.message}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Creating..." : "Create client"}</Button>
        </form>
      </Card>
    </div>
  );
}
