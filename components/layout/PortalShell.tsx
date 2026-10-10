"use client";

import { ClipboardList, FolderOpen, Images, LayoutDashboard, LogOut, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandBar } from "@/components/brand/BrandBar";
import { api, ApiError } from "@/lib/api";
import type { AdminProfile, ClientProfile } from "@/lib/types";

export type PortalIcon = "overview" | "clients" | "audit" | "collections" | "photos";

const ICONS: Record<PortalIcon, LucideIcon> = {
  overview: LayoutDashboard,
  clients: Users,
  audit: ClipboardList,
  collections: FolderOpen,
  photos: Images,
};

type NavItem = { href: string; label: string; icon: PortalIcon };

export function PortalShell({
  area,
  items,
  children,
}: {
  area: "admin" | "client";
  items: NavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const path = area === "admin" ? "/api/v1/admin/me" : "/api/v1/client/me";
    api<{ data: AdminProfile | ClientProfile }>(path)
      .then((response) => {
        if (area === "client" && "must_change_password" in response.data && response.data.must_change_password) {
          router.replace("/client/change-password");
          return;
        }
        setName("display_name" in response.data ? response.data.display_name : response.data.name);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && (error.status === 401 || error.code === "password_change_required")) {
          router.replace(error.code === "password_change_required" ? "/client/change-password" : area === "admin" ? "/admin/login" : "/client/login");
          return;
        }
        setReady(true);
      });
  }, [area, router]);

  async function signOut() {
    await api(area === "admin" ? "/api/v1/admin/logout" : "/api/v1/client/logout", { method: "POST" });
    router.replace(area === "admin" ? "/admin/login" : "/client/login");
  }

  return (
    <div className="min-h-dvh bg-page">
      <BrandBar />
      <div className="mx-auto flex max-w-6xl flex-col md:flex-row">
        <aside className="hidden w-56 shrink-0 p-4 md:block">
          <p className="px-3 pb-3 text-xs font-semibold tracking-wide text-muted uppercase">{area === "admin" ? "Admin" : "Gallery"}</p>
          <nav className="grid gap-1">
            {items.map((item) => {
              const active = item.href === "/admin" || item.href === "/client/gallery"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-primary-soft text-ink" : "text-muted hover:bg-surface"}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button type="button" onClick={signOut} className="mt-4 px-3 text-sm font-semibold text-muted">
            Sign out
          </button>
        </aside>
        <div className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:py-8">
          {name ? <p className="mb-4 text-sm text-muted md:hidden">{name}</p> : null}
          {ready ? children : <p className="text-sm text-muted">Loading...</p>}
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label={area === "admin" ? "Admin" : "Gallery"}>
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}>
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = item.href === "/admin" || item.href === "/client/gallery"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold leading-tight ${active ? "text-ink" : "text-muted"}`}
                >
                  <Icon size={20} aria-hidden className={active ? "text-primary" : undefined} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={signOut} className="flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold leading-tight text-muted">
              <LogOut size={20} aria-hidden />
              <span>Sign out</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
