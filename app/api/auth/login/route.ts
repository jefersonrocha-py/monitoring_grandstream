export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "../../../../lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

// 👉 Schema inline
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Informe a senha"),
});

// helpers JWT (mesmo que em lib/auth.ts, mas enxuto)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const expiresDays = Number(process.env.JWT_EXPIRES_DAYS || 7);
function authCookie(token: string) {
  const maxAge = expiresDays * 24 * 60 * 60;
  return `auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${
    process.env.NODE_ENV === "production" ? "Secure;" : ""
  }`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return Response.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return Response.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

    const token = await new SignJWT({ sub: String(user.id), email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${expiresDays}d`)
      .sign(secret);

    return new Response(
      JSON.stringify({ ok: true, user: { id: user.id, name: user.name, email: user.email } }),
      {
        status: 200,
        headers: { "Set-Cookie": authCookie(token), "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "VALIDATION_FAILED", details: e.errors }, { status: 400 });
    }
    return Response.json({ error: "AUTH_ERROR" }, { status: 500 });
  }
}
