"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import type { ClientCollection, Envelope } from "@/lib/types";

export default function GalleryHomePage() {
  const [collections, setCollections] = useState<ClientCollection[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<Envelope<ClientCollection[]>>("/api/v1/client/collections")
      .then((response) => {
        setCollections(response.data);
        setError("");
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Collections could not be loaded."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const common = collections.find((collection) => collection.type === "common");
  const events = collections.filter((collection) => collection.type === "event");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Your collections</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Open Common Gallery, an event folder, or every photo together.</p>
      </div>
      {loading ? <p className="text-sm text-muted">Loading collections...</p> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {common ? <CollectionCard collection={common} href="/client/gallery/common" eyebrow="Always available" /> : null}
        {events.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} href={`/client/gallery/events/${collection.id}`} eyebrow="Event" />
        ))}
        <Link href="/client/gallery/all" className="rounded-lg border border-line bg-brand p-5 text-white shadow-card">
          <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">Combined</p>
          <h2 className="mt-2 text-xl font-semibold">View all photos</h2>
          <p className="mt-2 text-sm text-white/80">Common Gallery and every event, with the collection name kept on each photo.</p>
        </Link>
      </div>
      {!loading && events.length === 0 ? (
        <EmptyState title="No named events yet">Common Gallery is ready whenever guests use the common camera link.</EmptyState>
      ) : null}
    </div>
  );
}

function CollectionCard({ collection, href, eyebrow }: { collection: ClientCollection; href: string; eyebrow: string }) {
  return (
    <Link href={href} className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{collection.name}</h2>
      <p className="mt-2 text-sm text-muted">
        {collection.visible_photo_count} visible {collection.visible_photo_count === 1 ? "photo" : "photos"}
        {collection.event_date ? ` · ${collection.event_date}` : ""}
      </p>
    </Link>
  );
}
