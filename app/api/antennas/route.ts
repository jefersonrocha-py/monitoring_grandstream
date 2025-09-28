// app/api/antennas/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const status = (searchParams.get("status") as "UP" | "DOWN" | null) ?? null;
    const q = (searchParams.get("q") || "").trim();
    const unsaved = searchParams.get("unsaved"); // "1" => só sem coords (lat/lon = 0)
    const placed = searchParams.get("placed");   // "1" => só com coords (lat!=0 & lon!=0)
    const takeParam = Number(searchParams.get("take") ?? 5000);
    const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 10000) : 5000;

    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { networkName: { contains: q, mode: "insensitive" } },
      ];
    }
    if (unsaved === "1") {
      where.lat = 0;
      where.lon = 0;
    }
    if (placed === "1") {
      where.AND = [
        ...(where.AND ?? []),
        { lat: { not: 0 } },
        { lon: { not: 0 } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.antenna.findMany({ where, orderBy: { id: "asc" }, take }),
      prisma.antenna.count({ where }),
    ]);

    return Response.json({
      ok: true,
      total: items.length,
      totalCount,
      items: items.map((a) => ({ ...a, updatedAt: a.updatedAt.toISOString() })),
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
