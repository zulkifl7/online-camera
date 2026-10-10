"use client";

import { GalleryView } from "@/components/gallery/GalleryView";

export default function CombinedGalleryPage() {
  return (
    <GalleryView
      title="All photos"
      description="Every visible photo from Common Gallery and your events. Each photo keeps its collection."
      path="/api/v1/client/photos"
      showFilter
    />
  );
}
