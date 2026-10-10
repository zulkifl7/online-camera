"use client";

import { use } from "react";
import { ClientGallery } from "@/components/admin/ClientGallery";

export default function ClientGalleryPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  return <ClientGallery clientId={clientId} />;
}
