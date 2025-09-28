"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Antenna, Stats } from "@services/api";
import DashboardCards from "@components/DashboardCards";
import DonutChart from "@components/DonutChart";
import { toCSV } from "@lib/csv";
import { connectSSE } from "@services/sseClient";

export default function DashboardPage() {
  const [list, setList] = useState<Antenna[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    // 👇 Aceita array (formato antigo) OU objeto { items: [...] } (formato novo)
    const [lRaw, s] = await Promise.all([
      api<any>("/api/antennas?take=500"), // <— importante: usa `any` pra compat
      api<Stats>("/api/stats"),
    ]);

    const l: Antenna[] = Array.isArray(lRaw) ? lRaw : (lRaw?.items ?? []);
    setList(Array.isArray(l) ? l : []);
    setStats(s);
  }

  useEffect(() => {
    load();
    const disconnect = connectSSE((e) => {
      try {
        const msg = JSON.parse(e.data);
        if (["antenna.created", "antenna.updated", "antenna.deleted", "status.changed"].includes(msg.event)) {
          load();
        }
      } catch {}
    });
    return disconnect;
  }, []);

  // Recebe busca enviada pela TopBar (tecla Enter)
  useEffect(() => {
    const handler = (e: any) => setQ((e.detail?.q || "").toLowerCase());
    window.addEventListener("search-antennas", handler as any);
    return () => window.removeEventListener("search-antennas", handler as any);
  }, []);

  const filtered = useMemo(
    () =>
      (Array.isArray(list) ? list : []).filter((a) =>
        (a?.name ?? "").toLowerCase().includes(q)
      ),
    [list, q]
  );

  async function toggleStatus(a: Antenna) {
    const next = a.status === "UP" ? "DOWN" : "UP";
    await api(`/api/antennas/${a.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  async function del(a: Antenna) {
    if (!confirm(`Excluir ${a.name}?`)) return;
    await api(`/api/antennas/${a.id}`, { method: "DELETE" });
    await load();
  }

  function exportCSV() {
    const csv = toCSV(
      filtered.map((a) => ({
        Nome: a.name,
        Lat: a.lat ?? "",
        Lon: a.lon ?? "",
        Status: a.status,
        AtualizadoEm:
          typeof a.updatedAt === "string"
            ? a.updatedAt
            : a.updatedAt
            ? new Date(a.updatedAt as any).toISOString()
            : "",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const aTag = document.createElement("a");
    aTag.href = url;
    aTag.download = "antenas.csv";
    aTag.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {stats && <DashboardCards {...stats} />}

      {stats && (
        <div className="glass rounded-2xl p-4">
          <DonutChart up={stats.up} down={stats.down} />
        </div>
      )}

      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          <div className="w-full md:w-80">
            <input
              placeholder="Filtrar por nome..."
              className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5"
              value={q}
              onChange={(e) => setQ(e.target.value.toLowerCase())}
              aria-label="Filtro por nome"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="px-3 py-2 rounded bg-brand1 text-white hover:opacity-90"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Latitude</th>
                <th className="text-left p-2">Longitude</th>
                <th className="text-left p-2">Última atualização</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const latStr =
                  typeof a.lat === "number" ? a.lat.toFixed(5) : a.lat ?? "-";
                const lonStr =
                  typeof a.lon === "number" ? a.lon.toFixed(5) : a.lon ?? "-";
                const updatedStr =
                  typeof a.updatedAt === "string"
                    ? new Date(a.updatedAt).toLocaleString()
                    : a.updatedAt
                    ? new Date(a.updatedAt as any).toLocaleString()
                    : "-";

                return (
                  <tr
                    key={a.id}
                    className="border-t border-black/10 dark:border-white/10"
                  >
                    <td className="p-2">{a.name}</td>
                    <td className="p-2">{latStr}</td>
                    <td className="p-2">{lonStr}</td>
                    <td className="p-2 text-xs opacity-70">{updatedStr}</td>
                    <td className="p-2">
                      <span
                        className={
                          a.status === "UP" ? "text-green-600" : "text-red-600"
                        }
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => toggleStatus(a)}
                        className="px-2 py-1 rounded bg-brand1 text-white hover:opacity-90"
                      >
                        Toggle
                      </button>
                      <button
                        onClick={() => del(a)}
                        className="px-2 py-1 rounded bg-red-600 text-white hover:opacity-90"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-center opacity-60">
                    Nenhuma antena encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
