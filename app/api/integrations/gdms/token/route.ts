import { NextResponse } from "next/server";
import { forceRefresh, getTokenInfo } from "@lib/gdmsToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/gdms/token  -> status (sem mostrar token)
export async function GET() {
  try {
    const info = await getTokenInfo();
    return NextResponse.json({ ok: true, ...info });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

// POST /api/integrations/gdms/token -> força refresh via OAuth
export async function POST() {
  try {
    const rec = await forceRefresh();
    return NextResponse.json({ ok: true, expiresAt: rec.expiresAt });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
