"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import type { Envelope } from "@/lib/types";

type Overview = {
  clients: number;
  active_clients: number;
  photos: number;
  hidden_photos: number;
  failed_photos: number;
  processing_photos: number;
};

export default function AdminHomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  function load() {
    api<Envelope<Overview>>("/api/v1/admin/overview")
      .then((response) => {
        setData(response.data);
        setError("");
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Overview could not be loaded."));
  }

  useEffect(() => {
    load();
  }, []);

  const cards = data
    ? [
        ["Clients", data.clients],
        ["Active clients", data.active_clients],
        ["Photos", data.photos],
        ["Hidden photos", data.hidden_photos],
        ["Processing", data.processing_photos],
        ["Failed", data.failed_photos],
      ]
    : [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Overview</h1>
        <p className="mt-2 text-sm text-muted">Clients, uploads, and photos waiting for recovery.</p>
      </div>
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
