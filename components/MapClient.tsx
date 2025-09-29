"use client";

/**
 * MapClient – Mogi Mirim com limites (maxBounds) + painel à direita
 *
 * - Limita o mapa à área aproximada de Mogi Mirim via maxBounds
 * - Enquadra automaticamente a cidade no load e no botão "Cidade"
 * - Mantém filtros/painel no canto direito sem conflitar com o zoom do Leaflet
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import { api } from "@services/api";
import { connectSSE } from "@services/sseClient";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faWifi,
  faArrowsRotate,
  faMagnifyingGlass,
  faBars,
  faXmark,
  faCircleCheck,
  faCircleXmark,
  faBroom,
  faLocationCrosshairs
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ===== helpers de ícone
function faToSvgDataUrl(icon: IconDefinition, color: string, scale = 1) {
  const def = icon.icon as unknown as [number, number, string[], string, string | string[]];
  const [w, h, , , paths] = def;
  const d = Array.isArray(paths) ? paths.join("") : paths;
  const viewW = w * scale;
  const viewH = h * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewW}" height="${viewH}" viewBox="0 0 ${w} ${h}">
  <path d="${d}" fill="${color}"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function makeLeafletIcon(color: string, scale = 1.0) {
  return L.icon({
    iconUrl: faToSvgDataUrl(faWifi, color, scale),
    iconSize: [28 * scale, 28 * scale],
    iconAnchor: [14 * scale, 28 * scale],
    popupAnchor: [0, -28 * scale],
    className: "drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]",
  });
}

// ===== Tipos
type Antenna = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  description?: string | null;
  status: "UP" | "DOWN" | string;
  networkName?: string | null;
  updatedAt?: string;
};

// ===== Centro e limites de Mogi Mirim
// Centro aproximado (prefeitura): lat -22.431, lon -46.955
const CITY_CENTER: LatLngExpression = [-22.431, -46.955];

// Limites retangulares aproximados da cidade (ajustado para bloquear pan fora da área urbana)
// sudoeste (lat, lng) -> nordeste (lat, lng)
const CITY_BOUNDS: LatLngBoundsExpression = [
  [-22.50, -47.05], // SW
  [-22.36, -46.86], // NE
];

// ===== Comps utilitários
function Recenter({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}
function FsResize() {
  const map = useMap();
  useEffect(() => {
    const onFs = () => setTimeout(() => map.invalidateSize(), 80);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("resize", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("resize", onFs);
    };
  }, [map]);
  return null;
}
function ClickPicker({
  enabled,
  setLat,
  setLon
}: {
  enabled: boolean;
  setLat: (v: string) => void;
  setLon: (v: string) => void;
}) {
  const map = useMap();
  useEffect(() => {
    function onClick(e: any) {
      if (!enabled) return;
      const { lat, lng } = e.latlng || {};
      if (typeof lat === "number" && typeof lng === "number") {
        setLat(String(lat.toFixed(5)));
        setLon(String(lng.toFixed(5)));
      }
    }
    map.on("click", onClick);
    return () => map.off("click", onClick);
  }, [map, enabled, setLat, setLon]);
  return null;
}

export default function MapClient() {
  const [antennas, setAntennas] = useState<Antenna[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UP" | "DOWN">("ALL");
  const [netFilter, setNetFilter] = useState<string>("");

  // painel
  const [panelOpen, setPanelOpen] = useState(true);

  // modal criar
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ref do mapa
  const mapRef = useRef<L.Map | null>(null);
  const onMapCreated = (map: L.Map) => {
    mapRef.current = map;
    // aplica bounds e viscosidade (bloqueia pan fora da área)
    map.setMaxBounds(CITY_BOUNDS);
    map.options.maxBounds = CITY_BOUNDS;
    map.options.maxBoundsViscosity = 1.0; // "parede de borracha"
    // enquadra a cidade no primeiro load
    map.fitBounds(CITY_BOUNDS, { padding: [24, 24] });
  };

  function fitCity() {
    const map = mapRef.current;
    if (!map) return;
    map.fitBounds(CITY_BOUNDS, { padding: [24, 24] });
  }

  // carregar antenas
  async function load() {
    try {
      const res = await fetch("/api/antennas?placed=1&take=5000", { cache: "no-store" });
      const json = await res.json();
      const arr: Antenna[] = Array.isArray(json) ? json : (json?.items ?? []);
      const prepared = arr
        .filter(a => Number.isFinite(Number(a.lat)) && Number.isFinite(Number(a.lon)))
        .map(a => ({ ...a, lat: Number(a.lat), lon: Number(a.lon) }));
      setAntennas(prepared);
      setLastLoadedAt(new Date().toLocaleTimeString());
    } catch {
      setAntennas([]);
    } finally {
      setLoading(false);
    }
  }

  // SSE + polling
  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await load(); })();
    let disconnect: (() => void) | undefined;
    try {
      disconnect = connectSSE?.((e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data);
          if (["antenna.updated", "antenna.created", "antenna.deleted", "status.changed"].includes(msg.event)) {
            load();
          }
        } catch {}
      });
    } catch {}
    const pollId = setInterval(load, 12_000);
    return () => { alive = false; clearInterval(pollId); disconnect?.(); };
  }, []);

  const iconUp = useMemo(() => makeLeafletIcon("#22c55e", 1.4), []);
  const iconDown = useMemo(() => makeLeafletIcon("#ef4444", 1.4), []);

  const networks = useMemo(
    () => Array.from(new Set(antennas.map(a => a.networkName ?? "").filter(Boolean))).sort(),
    [antennas]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return antennas.filter(a => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (netFilter && (a.networkName ?? "") !== netFilter) return false;
      if (!term) return true;
      const hay = `${a.name ?? ""} ${a.networkName ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [antennas, q, statusFilter, netFilter]);

  const totals = useMemo(() => {
    const total = filtered.length;
    const up = filtered.filter(a => a.status === "UP").length;
    const down = filtered.filter(a => a.status === "DOWN").length;
    return { total, up, down };
  }, [filtered]);

  function clearFilters() {
    setQ("");
    setStatusFilter("ALL");
    setNetFilter("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const latNum = Number(lat.toString().replace(",", "."));
    const lonNum = Number(lon.toString().replace(",", "."));
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) { setErr("Latitude/Longitude inválidas."); return; }
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) { setErr("Fora do intervalo geográfico."); return; }
    setSaving(true); setErr(null);
    try {
      const body = { name: name.trim(), lat: latNum, lon: lonNum, description: desc.trim() || undefined };
      const created = await api("/api/antennas", { method: "POST", body: JSON.stringify(body) });
      setAntennas((prev) => (created?.id ? [created, ...prev] : prev));
      setName(""); setLat(""); setLon(""); setDesc(""); setOpenModal(false);
    } catch (er: any) {
      setErr(er?.message || "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  return (
    <div id="map-root" className="relative h-[calc(100vh-8rem)] w-full rounded-xl overflow-hidden shadow-inner">

      {/* Botões do topo direito */}
      <div className="absolute z-[1005] top-4 right-4 flex gap-2 pointer-events-none">
        <button
          onClick={() => setPanelOpen(v => !v)}
          className="pointer-events-auto inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-white/85 text-black hover:bg-white shadow-lg"
          title={panelOpen ? "Fechar painel" : "Abrir painel"}
        >
          <FontAwesomeIcon icon={panelOpen ? faXmark : faBars} className="h-4 w-4" />
          <span className="text-sm">{panelOpen ? "Fechar" : "Painel"}</span>
        </button>
        <button
          onClick={fitCity}
          className="pointer-events-auto inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-white/85 text-black hover:bg-white shadow-lg"
          title="Enquadrar cidade"
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} className="h-4 w-4" />
          <span className="text-sm">Cidade</span>
        </button>
      </div>

      {/* PAINEL LATERAL (direito) */}
      <div
        className={`absolute z-[1004] top-16 right-4 w-[320px] max-h-[70vh] overflow-hidden rounded-2xl
          backdrop-blur-md bg-white/20 dark:bg-black/30 ring-1 ring-white/30 shadow-xl transition-all
          ${panelOpen ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-4 pointer-events-none"}`}
      >
        <div className="p-3 space-y-3 overflow-y-auto">
          {/* Filtros rápidos */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                className="pl-8 pr-3 py-2 w-full rounded-lg bg-white/85 text-black placeholder-black/60 outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Buscar por nome/rede…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 text-black/70 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={load}
              className="px-3 h-10 rounded-lg bg-white/85 text-black hover:bg-white"
              title="Recarregar"
            >
              <FontAwesomeIcon icon={faArrowsRotate} className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2 py-2 rounded-lg text-sm ${statusFilter==="ALL" ? "bg-emerald-600 text-white" : "bg-white/85 text-black hover:bg-white"}`}
            >Todos</button>
            <button
              onClick={() => setStatusFilter("UP")}
              className={`px-2 py-2 rounded-lg text-sm flex items-center justify-center gap-1 ${statusFilter==="UP" ? "bg-emerald-600 text-white" : "bg-white/85 text-black hover:bg-white"}`}
            ><FontAwesomeIcon icon={faCircleCheck} /> UP</button>
            <button
              onClick={() => setStatusFilter("DOWN")}
              className={`px-2 py-2 rounded-lg text-sm flex items-center justify-center gap-1 ${statusFilter==="DOWN" ? "bg-emerald-600 text-white" : "bg-white/85 text-black hover:bg-white"}`}
            ><FontAwesomeIcon icon={faCircleXmark} /> DOWN</button>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-white/25 p-2">
              <div className="text-xs opacity-80">Pins</div>
              <div className="text-lg font-semibold">{totals.total}</div>
            </div>
            <div className="rounded-xl bg-white/25 p-2">
              <div className="text-xs opacity-80">UP</div>
              <div className="text-lg font-semibold text-emerald-300">{totals.up}</div>
            </div>
            <div className="rounded-xl bg-white/25 p-2">
              <div className="text-xs opacity-80">DOWN</div>
              <div className="text-lg font-semibold text-red-300">{totals.down}</div>
            </div>
          </div>

          {/* Filtro por Rede */}
          <div className="space-y-1">
            <div className="text-xs opacity-80">Redes ({networks.length})</div>
            <div className="max-h-[26vh] overflow-auto pr-1">
              <button
                onClick={() => setNetFilter("")}
                className={`w-full text-left px-2 py-1 rounded-lg text-sm mb-1 ${netFilter==="" ? "bg-emerald-600 text-white" : "bg-white/85 text-black hover:bg-white"}`}
              >
                Todas as redes
              </button>
              {networks.map(n => {
                const count = antennas.filter(a => (a.networkName ?? "") === n &&
                  (statusFilter === "ALL" || a.status === statusFilter) &&
                  (q.trim() ? (`${a.name ?? ""} ${a.networkName ?? ""}`).toLowerCase().includes(q.trim().toLowerCase()) : true)
                ).length;
                return (
                  <button
                    key={n}
                    onClick={() => setNetFilter(prev => prev === n ? "" : n)}
                    className={`w-full text-left px-2 py-1 rounded-lg text-sm mb-1 ${
                      netFilter===n ? "bg-emerald-600 text-white" : "bg-white/85 text-black hover:bg-white"
                    }`}
                    title={n}
                  >
                    <span className="line-clamp-1">{n}</span>
                    <span className="float-right opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={clearFilters}
              className="w-full mt-2 px-3 py-2 rounded-lg bg-white/85 text-black hover:bg-white text-sm flex items-center gap-2 justify-center"
            >
              <FontAwesomeIcon icon={faBroom} /> Limpar filtros
            </button>
          </div>

          {/* Rodapé do painel */}
          <div className="text-xs opacity-80 text-center">
            {lastLoadedAt ? `Atualizado: ${lastLoadedAt}` : "—"}
          </div>
        </div>
      </div>

      {/* MAPA */}
      <MapContainer
        whenCreated={onMapCreated}
        center={CITY_CENTER}
        // o zoom inicial é ignorado se 'bounds'/'fitBounds' forem usados no onMapCreated,
        // mas deixamos um valor coerente
        zoom={12}
        className="h-full w-full"
        zoomControl
        scrollWheelZoom
        preferCanvas
        // segurança extra: prevenir ficar muito longe/fora
        minZoom={10}
        maxZoom={19}
        // manter coerência visual quando o usuário tenta arrastar para fora
        worldCopyJump={false}
      >
        {/* Satélite (Esri World Imagery) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        />

        <Recenter center={CITY_CENTER} />
        <FsResize />
        <ClickPicker enabled={openModal} setLat={setLat} setLon={setLon} />

        {!loading && filtered.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lon]} icon={a.status === "DOWN" ? iconDown : iconUp}>
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{a.name}</div>
                {a.networkName && <div className="opacity-80">{a.networkName}</div>}
                <div className="opacity-80">{a.lat.toFixed(5)}, {a.lon.toFixed(5)}</div>
                {a.description && <div className="opacity-80">{a.description}</div>}
                <div>
                  Status: <span className={a.status === "DOWN" ? "text-red-500 font-medium" : "text-emerald-400 font-medium"}>{a.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* FAB: Adicionar */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-[1003]">
        <button
          onClick={() => setOpenModal(true)}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition"
          title="Adicionar nova antena"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          <span className="font-medium">Adicionar</span>
        </button>
      </div>

      {/* Modal Nova Antena */}
      {openModal && (
        <div className="absolute inset-0 z-[1006] grid place-items-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white/90 dark:bg-neutral-900 text-black dark:text-white shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
            <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nova Antena</h3>
              <button onClick={() => setOpenModal(false)} className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" aria-label="Fechar">✕</button>
            </div>
            <form className="p-5 space-y-3" onSubmit={handleCreate}>
              <input className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} required />
                <input className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Longitude" value={lon} onChange={(e) => setLon(e.target.value)} required />
              </div>
              <textarea className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Descrição (opcional)" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
              {err && <div className="text-xs text-red-600 bg-red-600/10 border border-red-600/30 rounded p-2">{err}</div>}
              <div className="pt-1 flex items-center justify-between">
                <p className="text-xs opacity-80">Dica: clique no mapa com o modal aberto para preencher Lat/Lon.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpenModal(false)} className="px-4 h-10 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20">Cancelar</button>
                  <button type="submit" disabled={saving} className="px-4 h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60">{saving ? "Salvando..." : "Salvar"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
