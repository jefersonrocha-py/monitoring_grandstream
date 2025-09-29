// Worker leve: chama o endpoint de sync a cada 5 min usando fetch
// Não depende de Next, TS, Prisma, aliases, nada.

const BASE =
  process.env.APP_BASE_URL ||
  `http://${process.env.WEB_HOST || "web"}:${process.env.WEB_PORT || 3000}`;
const PATH = process.env.SYNC_PATH || "/api/integrations/gdms/sync";
const INTERVAL = Number(process.env.SYNC_INTERVAL_MS || 5 * 60 * 1000);

async function runOnce() {
  const url = `${BASE}${PATH}`;
  try {
    const r = await fetch(url, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    const stamp = new Date().toISOString();
    console.log(
      `[${stamp}] sync → ${r.status}`,
      j?.ok ?? null,
      j?.totalFetched ?? j?.totalAps ?? j?.total ?? ""
    );
  } catch (e) {
    console.error("sync failed:", e?.message || e);
  }
}

console.log(`[gdms-cron] started, base=${BASE}, path=${PATH}, interval=${INTERVAL}ms`);
await runOnce();
setInterval(runOnce, INTERVAL);
