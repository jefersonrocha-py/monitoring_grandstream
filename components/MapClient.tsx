"use client";

/**
 * MapClient
 * - Satélite (Esri) centrado em Mogi Mirim/SP
 * - Marcadores com ícone FontAwesome (verde=UP, vermelho=DOWN)
 * - FAB "Adicionar" abre modal para cadastrar antena manualmente
 * - Clique no mapa (com modal aberto) preenche Lat/Lon
 * - id="map-root" para fullscreen específico do mapa (controlado na TopBar)
 * - Recalcula tamanho do Leaflet ao entrar/sair do fullscreen
 * - Atualiza via SSE (antenna.updated/created/deleted/status.changed) + polling leve
 */

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import { api } from "@services/api";
import { connectSSE } from "@services/sseClient";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faWifi } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ===== FontAwesome -> inline SVG -> Leaflet Icon
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
  updatedAt?: string;
};

// ===== Helpers (Leaflet)
function Recenter({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// Recalcula o tamanho do mapa ao entrar/sair de fullscreen e em resize
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

// Permite clicar no mapa para preencher Lat/Lon quando o modal está aberto
function ClickPicker({
  enabled,
  setLat,
  setLon,
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

// ===== Componente principal
export default function MapClient() {
  // Centro: Mogi Mirim/SP
  const DEFAULT_CENTER: LatLngExpression = useMemo(() => [-22.431, -46.955], []);
  const [center] = useState<LatLngExpression>(DEFAULT_CENTER);

  const [antennas, setAntennas] = useState<Antenna[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Nova Antena
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // carregar antenas (apenas posicionadas) + SSE + polling leve
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        // ❗ só antenas com coordenadas e sem cache
        const res = await fetch("/api/antennas?placed=1&take=5000", { cache: "no-store" });
        const json = await res.json();
        const arr: Antenna[] = Array.isArray(json) ? json : (json?.items ?? []);
        if (alive) {
          // garantir número
          const prepared = arr
            .filter(a => Number.isFinite(Number(a.lat)) && Number.isFinite(Number(a.lon)))
            .map(a => ({ ...a, lat: Number(a.lat), lon: Number(a.lon) }));
          setAntennas(prepared);
        }
      } catch {
        if (alive) setAntennas([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    // SSE: recarrega quando houver mudanças relevantes
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
    } catch {
      // sem SSE, segue com polling
    }

    // Polling de segurança (12s)
    const pollId = setInterval(load, 12_000);

    return () => {
      alive = false;
      clearInterval(pollId);
      disconnect?.();
    };
  }, []);

  // Ícones
  const iconUp = useMemo(() => makeLeafletIcon("#22c55e", 1.4), []);
  const iconDown = useMemo(() => makeLeafletIcon("#ef4444", 1.4), []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    // validação mínima
    const latNum = Number(lat.toString().replace(",", "."));
    const lonNum = Number(lon.toString().replace(",", "."));
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      setErr("Latitude/Longitude inválidas.");
      return;
    }
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      setErr("Fora do intervalo geográfico.");
      return;
    }

    setSaving(true);
    setErr(null);
    try {
      const body = {
        name: name.trim(),
        lat: latNum,
        lon: lonNum,
        description: desc.trim() || undefined,
      };
      const created = await api("/api/antennas", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // como o mapa só mostra "placed=1", essa criada entra se tiver coords válidas
      setAntennas((prev) => {
        const next = Array.isArray(created) ? created : created?.id ? [created, ...prev] : prev;
        return next;
      });

      // reset
      setName("");
      setLat("");
      setLon("");
      setDesc("");
      setOpenModal(false);
    } catch (er: any) {
      setErr(er?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      id="map-root"
      className="relative h-[calc(100vh-8rem)] w-full rounded-xl overflow-hidden shadow-inner"
    >
      {/* MAPA */}
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        zoomControl
        scrollWheelZoom
        preferCanvas
      >
        {/* Satélite (Esri World Imagery) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        />

        <Recenter center={center} />
        <FsResize />
        <ClickPicker enabled={openModal} setLat={setLat} setLon={setLon} />

        {!loading &&
          antennas.map((a) => (
            <Marker
              key={a.id}
              position={[a.lat, a.lon]}
              icon={a.status === "DOWN" ? iconDown : iconUp}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <div className="font-semibold">{a.name}</div>
                  <div className="opacity-80">
                    {a.lat.toFixed(5)}, {a.lon.toFixed(5)}
                  </div>
                  {a.description && (
                    <div className="opacity-80">{a.description}</div>
                  )}
                  <div>
                    Status:{" "}
                    <span
                      className={
                        a.status === "DOWN"
                          ? "text-red-500 font-medium"
                          : "text-emerald-500 font-medium"
                      }
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* FAB: Adicionar */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-[401]">
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
        <div
          className="absolute inset-0 z-[402] grid place-items-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white/90 dark:bg-neutral-900 text-black dark:text-white shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
            <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nova Antena</h3>
              <button
                onClick={() => setOpenModal(false)}
                className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form className="p-5 space-y-3" onSubmit={handleCreate}>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                />
                <input
                  className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Longitude"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  required
                />
              </div>

              <textarea
                className="w-full px-3 py-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Descrição (opcional)"
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />

              {err && (
                <div className="text-xs text-red-600 bg-red-600/10 border border-red-600/30 rounded p-2">
                  {err}
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <p className="text-xs opacity-80">
                  Dica: clique no mapa com o modal aberto para preencher Lat/Lon.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-4 h-10 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
