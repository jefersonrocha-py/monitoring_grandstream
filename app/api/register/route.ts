export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@lib/prisma";
import { registerSchema } from "@lib/validatorsAuth";
import { mapPrismaError } from "@lib/prismaErrors";
import { signAuthToken, authCookie } from "@lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password } = registerSchema.parse(body);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email: email.toLowerCase(), passwordHash } });

    const token = await signAuthToken({ sub: String(user.id), email: user.email });
    return new Response(JSON.stringify({ ok: true, user: { id: user.id, name: user.name, email: user.email } }), {
      status: 201,
      headers: { "Set-Cookie": authCookie(token), "Content-Type": "application/json" }
    });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "VALIDATION_FAILED", details: e.errors }, { status: 400 });
    }
    const mapped = mapPrismaError(e);
    return Response.json(mapped.body, { status: mapped.status });
  }
}
