// app/api/integrations/gdms/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { listNetworks, listAPsByNetwork } from "@services/gdms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/gdms/sync
 * - modo full (sem query): descobre/insere/atualiza tudo
 * - modo status-only (?mode=status): atualiza apenas status/lastSyncAt (cron 5min)
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const statusOnly = mode === "status";

    const nets = await listNetworks();
    const now = new Date();

    let created = 0, updated = 0, statusChanged = 0, totalFetched = 0;
    const perNetwork: Array<{ id: string; name: string; fetched: number }> = [];
    const errors: Array<{ apId: string; reason: string }> = [];

    for (const n of nets) {
      const aps = await listAPsByNetwork(n.id, n.networkName ?? "");
      perNetwork.push({ id: n.id, name: n.networkName ?? "", fetched: aps.length });
      totalFetched += aps.length;

      for (const ap of aps) {
        try {
          const existing = await prisma.antenna.findFirst({
            where: { gdmsApId: ap.apId },
            select: { id: true, status: true, lat: true, lon: true },
          });

          if (statusOnly) {
            if (!existing) continue;
            const need = existing.status !== ap.status;
            await prisma.antenna.update({
              where: { gdmsApId: ap.apId },
              data: { status: ap.status, lastSyncAt: now },
            });
            updated++;
            if (need) {
              await prisma.statusHistory.create({ data: { antennaId: existing.id, status: ap.status } });
              statusChanged++;
            }
            continue;
          }

          const base: any = {
            name: ap.apName,
            networkId: ap.networkId,
            networkName: ap.networkName,
            status: ap.status,
            lastSyncAt: now,
          };

          if (existing && existing.lat === 0 && existing.lon === 0) {
            if (typeof ap.lat === "number") base.lat = ap.lat;
            if (typeof ap.lng === "number") base.lon = ap.lng;
          }

          if (!existing) {
            const createdRow = await prisma.antenna.create({
              data: {
                gdmsApId: ap.apId,
                ...base,
                lat: typeof base.lat === "number" ? base.lat : 0,
                lon: typeof base.lon === "number" ? base.lon : 0,
              },
            });
            await prisma.statusHistory.create({ data: { antennaId: createdRow.id, status: ap.status } });
            created++;
          } else {
            const need = existing.status !== ap.status;
            await prisma.antenna.update({ where: { gdmsApId: ap.apId }, data: base });
            if (need) {
              await prisma.statusHistory.create({ data: { antennaId: existing.id, status: ap.status } });
              statusChanged++;
            }
            updated++;
          }
        } catch (rowErr: any) {
          errors.push({ apId: ap.apId, reason: rowErr?.message ?? String(rowErr) });
        }
      }
    }

    return NextResponse.json({
      ok: errors.length === 0,
      mode: statusOnly ? "status" : "full",
      networks: nets.length,
      totalFetched, created, updated, statusChanged,
      perNetwork,
      errors: errors.slice(0, 50),
      at: now.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
