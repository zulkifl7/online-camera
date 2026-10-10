"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/components/layout/PortalShell";

const items = [
  { href: "/admin", label: "Overview", icon: "overview" as const },
  { href: "/admin/clients", label: "Clients", icon: "clients" as const },
  { href: "/admin/audit-logs", label: "Audit log", icon: "audit" as const },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell area="admin" items={items}>
      {children}
    </PortalShell>
  );
}
