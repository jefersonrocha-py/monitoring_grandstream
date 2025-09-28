import { NextResponse } from "next/server";
import { listNetworks, listAPsByNetwork } from "@services/gdms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/gdms/ping
 * — NÃO grava no banco. Mostra o que o cliente GDMS está vendo agora,
 *   incluindo um resumo por rede (id, nome, qtd APs).
 */
export async function GET() {
  try {
    const nets = await listNetworks();

    const perNetwork: Array<{ id: string; name: string; aps: number }> = [];
    let totalAps = 0;

    for (const n of nets) {
      const aps = await listAPsByNetwork(n.id, n.networkName ?? "");
      perNetwork.push({ id: n.id, name: n.networkName ?? "", aps: aps.length });
      totalAps += aps.length;
    }

    return NextResponse.json({
      ok: true,
      networks: nets.length,
      totalAps,
      perNetwork: perNetwork.slice(0, 20), // mostra as 20 primeiras no payload
      hint: "Se totalAps aqui é ~150, o cliente está OK. Se for 1, a paginação de networks/APs precisa revisar ou o token está escopado.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
