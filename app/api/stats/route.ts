import { prisma } from "@lib/prisma";

export async function GET() {
  const [total, up, down] = await Promise.all([
    prisma.antenna.count(),
    prisma.antenna.count({ where: { status: "UP" } }),
    prisma.antenna.count({ where: { status: "DOWN" } })
  ]);
  const upPct = total ? (up / total) * 100 : 0;
  const downPct = total ? (down / total) * 100 : 0;
  return Response.json({ total, up, down, upPct, downPct });
}
