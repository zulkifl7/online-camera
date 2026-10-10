"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import type { Envelope, PageMeta } from "@/lib/types";

type AuditRow = {
  id: string;
  actor_type: string;
  action: string;
  target_type: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [meta, setMeta] = useState<PageMeta>({});
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  function load(nextPage = page) {
    api<Envelope<AuditRow[]>>(`/api/v1/admin/audit-logs?page=${nextPage}`)
      .then((response) => {
        setRows(response.data);
        setMeta(response.meta ?? {});
        setError("");
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "The audit log could not be loaded."));
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Audit log</h1>
        <p className="mt-1 text-sm text-muted">Passwords and camera tokens are not written here.</p>
      </div>
      {error ? <ErrorState message={error} onRetry={() => load(page)} /> : null}
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-muted">{row.created_at ? new Date(row.created_at).toLocaleString() : ""}</td>
                <td className="px-4 py-3 capitalize">{row.actor_type}</td>
                <td className="px-4 py-3">{row.action}</td>
                <td className="px-4 py-3 text-muted">{row.target_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <button type="button" className="min-h-11 rounded-md border border-line px-3" disabled={(meta.current_page ?? 1) <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
        <span className="text-muted">Page {meta.current_page ?? 1} of {meta.last_page ?? 1}</span>
        <button type="button" className="min-h-11 rounded-md border border-line px-3" disabled={(meta.current_page ?? 1) >= (meta.last_page ?? 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
      </div>
    </div>
  );
}
