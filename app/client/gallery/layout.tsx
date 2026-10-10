"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/components/layout/PortalShell";

const items = [
  { href: "/client/gallery", label: "Collections", icon: "collections" as const },
  { href: "/client/gallery/all", label: "All photos", icon: "photos" as const },
];

export default function ClientGalleryLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell area="client" items={items}>
      {children}
    </PortalShell>
  );
}
