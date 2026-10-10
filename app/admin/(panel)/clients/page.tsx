"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/api";
import type { ClientAccount, Envelope, PageMeta } from "@/lib/types";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [meta, setMeta] = useState<PageMeta>({});
  const [error, setError] = useState("");

  function load(nextPage = page) {
    const params = new URLSearchParams({ page: String(nextPage), status });
    if (search.trim()) params.set("search", search.trim());
    api<Envelope<ClientAccount[]>>(`/api/v1/admin/clients?${params.toString()}`)
      .then((response) => {
        setClients(response.data);
        setMeta(response.meta ?? {});
        setError("");
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Clients could not be loaded."));
  }

  useEffect(() => {
    load(page);
    // Search is applied from the form so typing does not refetch on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Clients</h1>
          <p className="mt-1 text-sm text-muted">Each client receives one Common Gallery and a Common Camera link.</p>
        </div>
        <Link href="/admin/clients/new"><Button>Create client</Button></Link>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          load(1);
        }}
      >
        <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or username" />
        <label className="grid gap-1.5 text-sm font-medium">
          Status
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="min-h-11 rounded-md border border-line bg-surface px-3">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      {error ? <ErrorState message={error} onRetry={() => load(page)} /> : null}
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Couple</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Photos</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/clients/${client.id}`} className="font-semibold text-ink">{client.display_name}</Link>
                </td>
                <td className="px-4 py-3 text-muted">{client.username}</td>
                <td className="px-4 py-3"><StatusBadge status={client.status} /></td>
                <td className="px-4 py-3">{client.photos_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 ? <p className="px-4 py-8 text-sm text-muted">No clients match this search.</p> : null}
      </div>
      <div className="flex items-center justify-between text-sm">
        <Button variant="secondary" disabled={(meta.current_page ?? 1) <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span className="text-muted">Page {meta.current_page ?? 1} of {meta.last_page ?? 1}</span>
        <Button variant="secondary" disabled={(meta.current_page ?? 1) >= (meta.last_page ?? 1)} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div>
    </div>
  );
}
