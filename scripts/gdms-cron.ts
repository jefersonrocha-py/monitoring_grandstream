import { prisma } from "@lib/prisma";
import { listAllAps } from "@/services/gdms";
import { seedFromEnv } from "@/lib/gdmsToken";

const INTERVAL = Number(process.env.GDMS_SYNC_INTERVAL_MS ?? 300000);

async function runOnce() {
  const start = Date.now();
  seedFromEnv();
  try {
    const aps = await listAllAps();
    const now = new Date();
    let created = 0, updated = 0, statusChanged = 0;

    for (const ap of aps) {
      const existing = await prisma.antenna.findFirst({
        where: { gdmsApId: ap.apId },
        select: { id: true, status: true, lat: true, lon: true },
      });

      const base: any = {
        name: ap.apName,
        networkId: ap.networkId,
        networkName: ap.networkName,
        status: ap.status,
        lastSyncAt: now,
      };

      if ((existing?.lat ?? null) === null && (existing?.lon ?? null) === null) {
        if (typeof ap.lat === "number") base.lat = ap.lat;
        if (typeof ap.lng === "number") base.lon = ap.lng;
      }

      if (!existing) {
        const createdRow = await prisma.antenna.create({
          data: {
            gdmsApId: ap.apId,
            ...base,
            lat: base.lat ?? 0,
            lon: base.lon ?? 0,
          },
        });
        await prisma.statusHistory.create({
          data: { antennaId: createdRow.id, status: ap.status },
        });
        created++;
      } else {
        const prev = existing.status;
        const need = prev !== ap.status;

        await prisma.antenna.update({
          where: { gdmsApId: ap.apId },
          data: base,
        });
        updated++;

        if (need) {
          await prisma.statusHistory.create({
            data: { antennaId: existing.id, status: ap.status },
          });
          statusChanged++;
        }
      }
    }

    console.log(`[gdms-cron] ok total=${aps.length} created=${created} updated=${updated} statusChanged=${statusChanged} durMs=${Date.now()-start}`);
  } catch (e: any) {
    console.error("[gdms-cron] error:", e?.message ?? e);
  }
}

(async () => {
  console.log(`[gdms-cron] started, interval=${INTERVAL}ms`);
  await runOnce();
  setInterval(runOnce, INTERVAL);
})();
