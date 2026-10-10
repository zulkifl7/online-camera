"use client";

import { use } from "react";
import { GalleryView } from "@/components/gallery/GalleryView";

export default function EventGalleryPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = use(params);

  return (
    <GalleryView
      title="Event gallery"
      description="Only the photos uploaded with this event's camera link."
      path={`/api/v1/client/collections/${collectionId}/photos`}
    />
  );
}
