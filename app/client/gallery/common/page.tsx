"use client";

import { useEffect, useState } from "react";
import { GalleryView } from "@/components/gallery/GalleryView";
import { ErrorState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import type { ClientCollection, Envelope } from "@/lib/types";

export default function CommonGalleryPage() {
  const [collection, setCollection] = useState<ClientCollection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Envelope<ClientCollection[]>>("/api/v1/client/collections")
      .then((response) => {
        const common = response.data.find((item) => item.type === "common") ?? null;
        setCollection(common);
        if (!common) setError("Common Gallery is not available.");
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Common Gallery could not be opened."));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!collection) return <p className="text-sm text-muted">Loading Common Gallery...</p>;

  return (
    <GalleryView
      title="Common Gallery"
      description="Photos sent with the Common Camera link. This is not tied to one named event."
      path={`/api/v1/client/collections/${collection.id}/photos`}
    />
  );
}
