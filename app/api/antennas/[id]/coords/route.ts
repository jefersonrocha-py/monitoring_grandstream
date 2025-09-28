// app/api/antennas/[id]/coords/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { emit } from "@lib/sse";

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.trim().replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const idNum = Number(ctx.params.id);
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const json = await req.json().catch(() => ({} as any));
    const lat = toNum(json.lat);
    const lon = toNum(json.lon);
    const description = typeof json.description === "string" ? json.description.trim() : undefined;

    const data: any = {};
    if (lat !== null) data.lat = lat;
    if (lon !== null) data.lon = lon;
    if (description !== undefined) data.description = description;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "Nenhum campo válido para atualizar." }, { status: 400 });
    }
    if ("lat" in data && (data.lat < -90 || data.lat > 90)) {
      return NextResponse.json({ ok: false, error: "Latitude deve estar entre -90 e 90." }, { status: 400 });
    }
    if ("lon" in data && (data.lon < -180 || data.lon > 180)) {
      return NextResponse.json({ ok: false, error: "Longitude deve estar entre -180 e 180." }, { status: 400 });
    }

    const exists = await prisma.antenna.findUnique({ where: { id: idNum } });
    if (!exists) return NextResponse.json({ ok: false, error: "Antenna not found" }, { status: 404 });

    const updated = await prisma.antenna.update({ where: { id: idNum }, data });

    // avisa clientes (Mapa/Dashboard)
    emit?.("antenna.updated", { id: idNum, kind: "coords" });

    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
