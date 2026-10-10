"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import type { AdminCollection, AdminPhoto, ClientAccount, Envelope, PageMeta } from "@/lib/types";

type Detail = {
  client: ClientAccount;
  collections: AdminCollection[];
};

const ALL = "all";
const DELETED = "deleted";

export function ClientGallery({ clientId }: { clientId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [folder, setFolder] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [meta, setMeta] = useState<PageMeta>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api<Envelope<Detail>>(`/api/v1/admin/clients/${clientId}`)
      .then((response) => {
        setDetail(response.data);
        setLoadError("");
      })
      .catch((caught: unknown) => setLoadError(caught instanceof Error ? caught.message : "The client could not be loaded."));
  }, [clientId]);

  function load(nextPage = page) {
    const params = new URLSearchParams({ page: String(nextPage), client_id: clientId });
    if (folder !== ALL && folder !== DELETED) params.set("collection_id", folder);
    const path = folder === DELETED ? "/api/v1/admin/photos/hidden" : "/api/v1/admin/photos";
    if (folder !== DELETED) params.set("visibility", "visible");
    api<Envelope<AdminPhoto[]>>(`${path}?${params.toString()}`)
      .then((response) => {
        setPhotos(response.data);
        setMeta(response.meta ?? {});
        setError("");
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Photos could not be loaded."));
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, folder, page]);

  function chooseFolder(next: string) {
    setFolder(next);
    setPage(1);
    setSelected([]);
    setConfirmDelete(false);
  }

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function togglePage() {
    const ids = photos.map((photo) => photo.id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((current) => (allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]));
  }

  async function restoreSelected() {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      await api("/api/v1/admin/photos/bulk-restore", {
        method: "POST",
        body: JSON.stringify({ client_id: clientId, photo_ids: selected }),
      });
      setSelected([]);
      load(page);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The selected photos could not be restored.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      await api("/api/v1/admin/photos/bulk", {
        method: "DELETE",
        body: JSON.stringify({ client_id: clientId, photo_ids: selected, confirm: true }),
      });
      setSelected([]);
      setConfirmDelete(false);
      load(page);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The selected photos could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <p className="text-sm text-muted">{loadError || "Loading gallery..."}</p>;

  const common = detail.collections.find((collection) => collection.type === "common");
  const events = detail.collections.filter((collection) => collection.type === "event");
  const deleted = folder === DELETED;
  const pageIds = photos.map((photo) => photo.id);
  const pageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted">{detail.client.display_name}</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Image gallery</h1>
        </div>
        <Link href={`/admin/clients/${clientId}`} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink">
          Back to client
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {common ? (
          <FolderButton label={common.name} eyebrow="Common" pressed={folder === common.id} onClick={() => chooseFolder(common.id)} />
        ) : null}
        {events.map((collection) => (
          <FolderButton key={collection.id} label={collection.name} eyebrow="Event" pressed={folder === collection.id} onClick={() => chooseFolder(collection.id)} />
        ))}
        <FolderButton label="All photos" eyebrow="Combined" pressed={folder === ALL} onClick={() => chooseFolder(ALL)} dark />
        <FolderButton label="Deleted images" eyebrow="Removed by the couple" pressed={folder === DELETED} onClick={() => chooseFolder(DELETED)} />
      </div>

      {error ? <ErrorState message={error} onRetry={() => load(page)} /> : null}

      {deleted ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-muted">Select the photos to restore to the gallery, or delete the selected files permanently.</p>
          {photos.length > 0 ? (
            <Button variant="secondary" onClick={togglePage}>{pageSelected ? "Clear this page" : "Select this page"}</Button>
          ) : null}
        </div>
      ) : null}

      {photos.length === 0 ? (
        <p className="text-sm text-muted">{deleted ? "No deleted images for this client." : "No photos in this folder."}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => {
            const isSelected = selected.includes(photo.id);
            return (
              <li key={photo.id} className="relative overflow-hidden rounded-lg border border-line bg-surface">
                {photo.thumbnail_url ? (
                  <img src={photo.thumbnail_url} alt="" className="aspect-square w-full object-cover" />
                ) : (
                  <span className="flex aspect-square items-center justify-center bg-subtle text-sm text-muted">No preview</span>
                )}
                {deleted ? (
                  <label className="absolute top-2 left-2 inline-flex size-11 items-center justify-center rounded-md bg-surface/90">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(photo.id)}
                      aria-label={`Select deleted photo from ${photo.collection_name ?? "collection"}`}
                      className="size-5 accent-primary"
                    />
                  </label>
                ) : null}
                {photo.collection_name ? (
                  <span className="absolute right-2 bottom-2 rounded-full bg-surface/90 px-2 py-1 text-[11px] font-medium text-ink">{photo.collection_name}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {photos.length > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <button type="button" className="min-h-11 rounded-md border border-line bg-surface px-3" disabled={(meta.current_page ?? 1) <= 1} onClick={() => setPage((meta.current_page ?? 1) - 1)}>Previous</button>
          <span className="text-muted">Page {meta.current_page ?? 1} of {meta.last_page ?? 1}</span>
          <button type="button" className="min-h-11 rounded-md border border-line bg-surface px-3" disabled={(meta.current_page ?? 1) >= (meta.last_page ?? 1)} onClick={() => setPage((meta.current_page ?? 1) + 1)}>Next</button>
        </div>
      ) : null}

      {deleted && selected.length > 0 ? (
        <div className="sticky bottom-16 z-10 flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 shadow-floating md:bottom-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-ink">{selected.length} selected</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" disabled={busy} onClick={() => setSelected([])}>Clear selection</Button>
            <Button variant="secondary" disabled={busy} onClick={restoreSelected}>Restore selected</Button>
            <Button variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete selected</Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Permanently delete the selected photos?"
        confirmLabel="Delete selected"
        tone="danger"
        busy={busy}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteSelected}
      >
        This removes the selected originals, thumbnails, and previews from storage. They cannot be restored from this screen. Backup copies outside this application may still exist until the hosting retention period ends.
      </ConfirmDialog>
    </div>
  );
}

function FolderButton({
  label,
  eyebrow,
  pressed,
  onClick,
  dark = false,
}: {
  label: string;
  eyebrow: string;
  pressed: boolean;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-lg border p-5 text-left shadow-card ${dark ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink"} ${pressed && !dark ? "ring-2 ring-primary" : ""} ${pressed && dark ? "ring-2 ring-white" : ""}`}
    >
      <p className={`text-xs font-semibold tracking-wide uppercase ${dark ? "text-white/70" : "text-muted"}`}>{eyebrow}</p>
      <span className="mt-2 block text-xl font-semibold">{label}</span>
    </button>
  );
}
