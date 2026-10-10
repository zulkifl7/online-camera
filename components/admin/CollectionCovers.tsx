"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { AdminCollection } from "@/lib/types";

export function CollectionCovers({
  collection,
  onUpdated,
}: {
  collection: AdminCollection;
  onUpdated: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"mobile" | "desktop" | null>(null);

  async function upload(slot: "mobile" | "desktop", file: File | undefined) {
    if (!file) return;
    setBusy(slot);
    setError("");
    try {
      const body = new FormData();
      body.append(slot, file);
      await api(`/api/v1/admin/collections/${collection.id}/covers`, { method: "POST", body });
      onUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The cover image could not be uploaded.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-surface p-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">{collection.name} cover images</h3>
        <p className="mt-1 text-xs leading-5 text-muted">These images are the background of this camera page. Use one framed for a phone and one for a computer.</p>
      </div>
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <CoverSlot
          label="Mobile cover"
          preview={collection.cover_mobile_url}
          busy={busy === "mobile"}
          onFile={(file) => upload("mobile", file)}
        />
        <CoverSlot
          label="PC cover"
          preview={collection.cover_desktop_url}
          busy={busy === "desktop"}
          onFile={(file) => upload("desktop", file)}
        />
      </div>
    </div>
  );
}

function CoverSlot({
  label,
  preview,
  busy,
  onFile,
}: {
  label: string;
  preview: string | null;
  busy: boolean;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      {preview ? <img src={preview} alt="" className="h-28 w-full rounded-md object-cover" /> : <span className="grid h-28 place-items-center rounded-md bg-subtle text-xs font-normal text-muted">No image yet</span>}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-3 text-sm font-semibold">
        {busy ? "Uploading..." : preview ? "Replace image" : "Upload image"}
      </span>
    </label>
  );
}
