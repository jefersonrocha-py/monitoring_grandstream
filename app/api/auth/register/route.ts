export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// 👉 Schema inline (evita alias quebrado)
const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(80),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// 👉 Mapper Prisma inline (P2002 = unique)
function mapPrismaError(e: any): { status: number; body: any } {
  if (e?.code === "P2002") {
    return { status: 409, body: { error: "UNIQUE_CONSTRAINT" } };
  }
  return { status: 500, body: { error: "DB_ERROR" } };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password } = registerSchema.parse(body);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash },
    });

    // Não autentica aqui: volta pro login
    return Response.json(
      { ok: true, user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "VALIDATION_FAILED", details: e.errors }, { status: 400 });
    }
    const mapped = mapPrismaError(e);
    return Response.json(mapped.body, { status: mapped.status });
  }
}
