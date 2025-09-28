"use client";

import { useEffect, useMemo, useState } from "react";

type Antenna = {
  id: number;
  name: string;
  networkName?: string | null;
  status: "UP" | "DOWN";
  lat: number;
  lon: number;
  description?: string | null;
  updatedAt?: string;
};
type ApiList = { ok: boolean; items: Antenna[]; total: number; totalCount?: number } | Antenna[];

export default function SettingsPage() {
  const [list, setList] = useState<Antenna[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState("");

  const [draft, setDraft] = useState<Record<number, { lat?: string; lon?: string; description?: string }>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/antennas?take=5000&unsaved=1", { cache: "no-store" });
      const json: ApiList = await res.json();
      const items = Array.isArray(json) ? json : (json?.items ?? []);
      setList(Array.isArray(items) ? items : []);
      const d: Record<number, any> = {};
      for (const a of (Array.isArray(items) ? items : [])) {
        d[a.id] = {
          lat: (typeof a.lat === "number" ? a.lat : 0).toString(),
          lon: (typeof a.lon === "number" ? a.lon : 0).toString(),
          description: a.description ?? ""
        };
      }
      setDraft(d);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return list;
    return list.filter(a =>
      (a.name ?? "").toLowerCase().includes(x) ||
      (a.networkName ?? "").toLowerCase().includes(x)
    );
  }, [list, q]);

  async function doSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/gdms/sync", { method: "POST" });
      await load();
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Sync falhou: ${j?.error ?? res.statusText}`);
      }
    } catch (e: any) {
      alert(`Sync erro: ${e?.message ?? e}`);
    } finally {
      setSyncing(false);
    }
  }

  function updateDraft(id: number, field: "lat" | "lon" | "description", value: string) {
    setDraft(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveRow(a: Antenna) {
    const d = draft[a.id] ?? {};
    const payload: any = {};
    if (d.lat !== undefined) payload.lat = d.lat;
    if (d.lon !== undefined) payload.lon = d.lon;
    if (d.description !== undefined) payload.description = d.description;

    const res = await fetch(`/api/antennas/${a.id}/coords`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Falha ao salvar: ${j?.error ?? res.statusText}`);
      return;
    }

    // remove imediatamente da lista de “pendentes”
    setList(prev => prev.filter(x => x.id !== a.id));
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Configurações</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">Pendentes: {list.length}</span>
          <input
            placeholder="Buscar por AP ou Rede..."
            className="px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={doSync}
            disabled={syncing}
            className="px-3 py-2 rounded bg-brand1 text-white hover:opacity-90 disabled:opacity-50"
            title="Buscar APs e status no GDMS agora"
          >
            {syncing ? "Sincronizando..." : "Sincronizar GDMS agora"}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="text-sm opacity-70 mb-3">
          Cadastre Latitude/Longitude e Observações. O status é atualizado pelo sincronismo (5 min / manual).
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="text-left p-2">Nome do AP</th>
                <th className="text-left p-2">Nome da Rede</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Latitude</th>
                <th className="text-left p-2">Longitude</th>
                <th className="text-left p-2">Observações</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-4 opacity-60">Carregando...</td></tr>
              )}

              {!loading && filtered.map((a) => {
                const d = draft[a.id] ?? {};
                const isUp = a.status === "UP";
                return (
                  <tr key={a.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="p-2">{a.name}</td>
                    <td className="p-2">{a.networkName ?? "-"}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${isUp ? "bg-green-500/20 text-green-600 dark:text-green-300" : "bg-red-500/20 text-red-600 dark:text-red-300"}`}>
                        {isUp ? "UP" : "DOWN"}
                      </span>
                    </td>
                    <td className="p-2">
                      <input
                        className="px-2 py-1 rounded bg-white/70 dark:bg-white/5 w-32"
                        value={d.lat ?? ""}
                        onChange={(e) => updateDraft(a.id, "lat", e.target.value)}
                        placeholder="-23.5"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="px-2 py-1 rounded bg-white/70 dark:bg-white/5 w-32"
                        value={d.lon ?? ""}
                        onChange={(e) => updateDraft(a.id, "lon", e.target.value)}
                        placeholder="-46.6"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="px-2 py-1 rounded bg-white/70 dark:bg-white/5 w-[18rem]"
                        value={d.description ?? ""}
                        onChange={(e) => updateDraft(a.id, "description", e.target.value)}
                        placeholder="Ponto de referência / observações…"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => saveRow(a)}
                        className="px-3 py-1.5 rounded bg-brand1 text-white hover:opacity-90"
                        title="Salvar Latitude/Longitude/Observações"
                      >
                        Salvar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center opacity-60">
                    Nenhum AP pendente no momento.
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
