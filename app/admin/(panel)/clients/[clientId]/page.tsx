"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CollectionCovers } from "@/components/admin/CollectionCovers";
import { QrPanel } from "@/components/admin/QrPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/api";
import type { AdminCollection, ClientAccount, Envelope } from "@/lib/types";

type Detail = {
  client: ClientAccount;
  collections: AdminCollection[];
  client_login_url: string;
  client_login_label: string;
};

type Credentials = { username: string; temporary_password: string };

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api<Envelope<Detail>>(`/api/v1/admin/clients/${clientId}`)
      .then((response) => {
        setDetail(response.data);
        setError("");
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "The client could not be loaded."));
  }

  useEffect(() => {
    const stored = sessionStorage.getItem(`cc-provision-${clientId}`);
    if (stored) {
      setCredentials(JSON.parse(stored) as Credentials);
    }
    load();
    // The client id comes from the route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function resetPassword() {
    setBusy(true);
    try {
      const response = await api<Envelope<Credentials>>(`/api/v1/admin/clients/${clientId}/reset-password`, { method: "POST" });
      setCredentials(response.data);
      sessionStorage.setItem(`cc-provision-${clientId}`, JSON.stringify(response.data));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The password could not be reset.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: ClientAccount["status"]) {
    setBusy(true);
    try {
      await api(`/api/v1/admin/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The client could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function addEvent(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(`/api/v1/admin/clients/${clientId}/events`, {
        method: "POST",
        body: JSON.stringify({ name: eventName, event_date: eventDate || null }),
      });
      setEventName("");
      setEventDate("");
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The event could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function collectionAction(collection: AdminCollection, action: "pause" | "resume" | "rotate") {
    setBusy(true);
    try {
      if (action === "rotate" && collection.camera_link) {
        await api(`/api/v1/admin/camera-links/${collection.camera_link.id}/rotate`, { method: "POST" });
      } else {
        await api(`/api/v1/admin/collections/${collection.id}/${action}-uploads`, { method: "POST" });
      }
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The camera link could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  function dismissCredentials() {
    sessionStorage.removeItem(`cc-provision-${clientId}`);
    setCredentials(null);
  }

  if (!detail) return <p className="text-sm text-muted">{error || "Loading client..."}</p>;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{detail.client.display_name}</h1>
          <p className="mt-1 text-sm text-muted">Username {detail.client.username}</p>
        </div>
        <StatusBadge status={detail.client.status} />
      </div>

      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}

      {credentials ? (
        <Card className="border-primary bg-primary-soft p-4">
          <h2 className="text-base font-semibold text-ink">Temporary password</h2>
          <p className="mt-1 text-sm text-muted">Shown only now. It is not stored in a way that can be opened again. The couple must change it at first login.</p>
          <p className="mt-3 font-mono text-lg text-ink">{credentials.username}</p>
          <p className="font-mono text-2xl font-semibold tracking-widest text-ink">{credentials.temporary_password}</p>
          <Button className="mt-3" variant="secondary" onClick={dismissCredentials}>I have saved these credentials</Button>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={resetPassword} disabled={busy || detail.client.status === "archived"}>Reset password</Button>
        {detail.client.status !== "active" ? <Button variant="secondary" onClick={() => setStatus("active")} disabled={busy}>Mark active</Button> : null}
        {detail.client.status === "active" ? <Button variant="secondary" onClick={() => setStatus("suspended")} disabled={busy}>Suspend</Button> : null}
        {detail.client.status !== "archived" ? <Button variant="danger" onClick={() => setStatus("archived")} disabled={busy}>Archive</Button> : null}
      </div>

      <div>
        <Link href={`/admin/clients/${clientId}/gallery`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
          View image gallery
        </Link>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-ink">Camera links</h2>
        <QrPanel label={detail.client_login_label} url={detail.client_login_url} />
        {detail.collections.map((collection) => (
          <div key={collection.id} className="grid gap-3">
            <QrPanel
              label={collection.qr_label}
              url={collection.camera_link?.url ?? null}
              status={collection.camera_link?.status}
              uploadsEnabled={collection.uploads_enabled}
              busy={busy}
              onPause={() => collectionAction(collection, "pause")}
              onResume={() => collectionAction(collection, "resume")}
              onRotate={() => collectionAction(collection, "rotate")}
            />
            <CollectionCovers collection={collection} onUpdated={load} />
          </div>
        ))}
      </section>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-ink">Add event</h2>
        <p className="mt-1 text-sm text-muted">Each event gets its own camera link. Uploads from that QR go only to that event.</p>
        <form onSubmit={addEvent} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <TextField label="Event name" value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="Mehendi, Wedding, Reception" required />
          <TextField label="Date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          <Button type="submit" disabled={busy}>Add event</Button>
        </form>
      </Card>
    </div>
  );
}
