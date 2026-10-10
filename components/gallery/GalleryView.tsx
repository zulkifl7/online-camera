"use client";

import { Check, Download, ImageIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { api, ApiError, downloadAuthorized } from "@/lib/api";
import type { ClientCollection, DownloadJob, Envelope, GalleryPhoto } from "@/lib/types";

export function GalleryView({
  title,
  description,
  path,
  showFilter = false,
}: {
  title: string;
  description: string;
  path: string;
  showFilter?: boolean;
}) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [collections, setCollections] = useState<ClientCollection[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<GalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hideIds, setHideIds] = useState<string[]>([]);
  const [hideOpen, setHideOpen] = useState(false);
  const [downloadIds, setDownloadIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<DownloadJob | null>(null);

  const load = useCallback(async (nextCursor?: string | null, replace = false) => {
    setError("");
    const url = new URL(path, "http://local");
    if (filter) url.searchParams.set("collection_id", filter);
    if (nextCursor) url.searchParams.set("cursor", nextCursor);
    const query = `${url.pathname}${url.search}`;
    try {
      const response = await api<Envelope<GalleryPhoto[]>>(query);
      setPhotos((current) => (replace ? response.data : [...current, ...response.data]));
      setCursor(response.meta?.next_cursor ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The gallery could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [filter, path]);

  useEffect(() => {
    setLoading(true);
    setPhotos([]);
    setSelected([]);
    void load(null, true);
  }, [load]);

  useEffect(() => {
    if (!showFilter) return;
    api<Envelope<ClientCollection[]>>("/api/v1/client/collections")
      .then((response) => setCollections(response.data))
      .catch(() => setCollections([]));
  }, [showFilter]);

  useEffect(() => {
    if (!download || (download.status !== "queued" && download.status !== "processing")) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await api<Envelope<DownloadJob>>(`/api/v1/client/downloads/${download.id}`);
        setDownload(response.data);
      } catch (caught) {
        setDownload({ ...download, status: "failed", error_message: caught instanceof Error ? caught.message : "The download failed." });
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [download]);

  const selectedCount = selected.length;
  const selectionLabel = useMemo(() => `${selectedCount} selected`, [selectedCount]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function hide(ids: string[]) {
    setBusy(true);
    try {
      await api("/api/v1/client/photos/bulk-hide", {
        method: "POST",
        body: JSON.stringify({ photo_ids: ids }),
      });
      setPhotos((current) => current.filter((photo) => !ids.includes(photo.id)));
      setSelected((current) => current.filter((id) => !ids.includes(id)));
      setActive(null);
      setHideOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The photos could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function requestDownload(ids: string[]) {
    setDownloadIds(ids);
    setError("");
    try {
      const response = await api<Envelope<DownloadJob>>("/api/v1/client/downloads", {
        method: "POST",
        body: JSON.stringify({ photo_ids: ids }),
      });
      setDownload(response.data);
      if (response.data.status === "ready" && response.data.download_url && response.data.file_name) {
        await downloadAuthorized(response.data.download_url, response.data.file_name);
        setDownload({ ...response.data, status: "ready" });
      }
    } catch (caught) {
      setDownload({
        id: "",
        mode: ids.length > 1 ? "archive" : "single",
        status: "failed",
        file_name: null,
        file_size_bytes: null,
        photo_count: ids.length,
        error_message: caught instanceof Error ? caught.message : "The download could not be prepared.",
        download_url: null,
      });
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
        {showFilter ? (
          <label className="grid gap-1 text-sm font-medium text-ink">
            Collection
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="min-h-11 rounded-md border border-line bg-surface px-3"
            >
              <option value="">All photos</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {error ? <ErrorState message={error} onRetry={() => load(null, true)} /> : null}
      {loading ? <p className="text-sm text-muted">Loading photos...</p> : null}
      {!loading && photos.length === 0 ? (
        <EmptyState title="No photos yet">
          Photos appear here after guests upload them with the camera link for this collection.
        </EmptyState>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => {
          const isSelected = selected.includes(photo.id);
          return (
            <li key={photo.id} className="relative">
              <button type="button" onClick={() => setActive(photo)} className="block w-full overflow-hidden rounded-md border border-line bg-subtle">
                <img src={photo.thumbnail_url} alt="" className="aspect-square w-full object-cover" />
              </button>
              <label className="absolute top-2 left-2 inline-flex size-11 items-center justify-center rounded-md bg-surface/90">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(photo.id)}
                  aria-label={`Select photo from ${photo.collection_name ?? "collection"}`}
                  className="size-5 accent-primary"
                />
              </label>
              {showFilter && photo.collection_name ? (
                <span className="absolute right-2 bottom-2 rounded-full bg-surface/90 px-2 py-1 text-[11px] font-medium text-ink">
                  {photo.collection_name}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {cursor ? (
        <Button variant="secondary" onClick={() => load(cursor)}>
          Load more photos
        </Button>
      ) : null}

      {selectedCount > 0 ? (
        <div className="sticky bottom-16 z-10 flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 shadow-floating md:bottom-4 md:flex-row md:items-center md:justify-between" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <p className="text-sm font-semibold text-ink">{selectionLabel}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => setSelected([])}>Clear selection</Button>
            <Button variant="secondary" onClick={() => requestDownload(selected)}>
              <Download size={16} aria-hidden />
              Download selected
            </Button>
            <Button variant="danger" onClick={() => { setHideIds(selected); setHideOpen(true); }}>Delete selected</Button>
          </div>
        </div>
      ) : null}

      {active ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-overlay p-4 sm:items-center" role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Photo preview" className="grid w-full max-w-3xl gap-4 rounded-lg bg-surface p-4 shadow-floating">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">{active.collection_name ?? "Photo"}</p>
              <button type="button" aria-label="Close preview" onClick={() => setActive(null)} className="inline-flex size-11 items-center justify-center rounded-md">
                <X size={18} />
              </button>
            </div>
            <img src={active.preview_url} alt={`Photo from ${active.collection_name ?? "the gallery"}`} className="max-h-[70vh] w-full rounded-md object-contain bg-subtle" />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => requestDownload([active.id])}>
                <Download size={16} aria-hidden />
                Download
              </Button>
              <Button variant="danger" onClick={() => { setHideIds([active.id]); setHideOpen(true); }}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={hideOpen}
        title="Delete these photos?"
        confirmLabel="Delete"
        tone="danger"
        busy={busy}
        onClose={() => setHideOpen(false)}
        onConfirm={() => hide(hideIds)}
      >
        These photos will leave your gallery and your downloads. An administrator can still restore them.
      </ConfirmDialog>

      {download ? (
        <div className="fixed right-4 bottom-20 z-30 w-[min(100%-2rem,22rem)] rounded-lg border border-line bg-surface p-4 shadow-floating md:bottom-4" aria-live="polite">
          <div className="flex items-start gap-3">
            {download.status === "ready" ? <Check size={18} className="text-success" /> : download.status === "failed" ? <ImageIcon size={18} className="text-danger" /> : <Download size={18} className="text-primary" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {download.status === "queued" && "Your download is in the queue"}
                {download.status === "processing" && "Preparing download..."}
                {download.status === "ready" && "Download started"}
                {download.status === "failed" && (download.error_message ?? "The download failed.")}
              </p>
              {download.file_size_bytes ? <p className="mt-1 text-xs text-muted">{formatBytes(download.file_size_bytes)}</p> : null}
              {download.status === "queued" || download.status === "processing" ? (
                <div className="mt-3">
                  <ProgressBar label="Download preparation" indeterminate />
                </div>
              ) : null}
              {download.status === "ready" && download.download_url && download.file_name ? (
                <Button className="mt-3" onClick={() => downloadAuthorized(download.download_url!, download.file_name!)}>
                  Download {download.mode === "archive" ? "ZIP" : "photo"}
                </Button>
              ) : null}
              {download.status === "failed" ? (
                <Button className="mt-3" variant="secondary" onClick={() => requestDownload(downloadIds)}>
                  Try again
                </Button>
              ) : null}
            </div>
            <button type="button" aria-label="Dismiss download status" onClick={() => setDownload(null)} className="inline-flex size-11 items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
