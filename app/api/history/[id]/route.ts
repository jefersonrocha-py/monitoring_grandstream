import { prisma } from "@lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 50);
  const rows = await prisma.statusHistory.findMany({
    where: { antennaId: Number(params.id) },
    orderBy: { changedAt: "desc" },
    take: limit
  });
  return Response.json(rows);
}
