// app/api/antennas/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { emit } from "@lib/sse";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const idNum = Number(ctx.params.id);
  if (!Number.isFinite(idNum)) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
  const item = await prisma.antenna.findUnique({ where: { id: idNum } });
  if (!item) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const idNum = Number(ctx.params.id);
  if (!Number.isFinite(idNum)) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  const json = await req.json().catch(() => ({} as any));
  const data: any = {};
  if (json.status === "UP" || json.status === "DOWN") data.status = json.status;
  if (typeof json.name === "string") data.name = json.name;
  if (typeof json.description === "string") data.description = json.description;
  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });

  const before = await prisma.antenna.findUnique({ where: { id: idNum }, select: { id: true, status: true } });
  if (!before) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const updated = await prisma.antenna.update({ where: { id: idNum }, data });

  if (data.status && data.status !== before.status) {
    await prisma.statusHistory.create({ data: { antennaId: idNum, status: data.status } });
    emit?.("status.changed", { id: idNum, status: data.status });
  } else {
    emit?.("antenna.updated", { id: idNum });
  }

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const idNum = Number(ctx.params.id);
  if (!Number.isFinite(idNum)) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

  try {
    const deleted = await prisma.antenna.delete({ where: { id: idNum } });
    emit?.("antenna.deleted", { id: idNum });
    return NextResponse.json({ ok: true, item: deleted });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    const status = msg.includes("Record to delete does not exist") ? 404 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
