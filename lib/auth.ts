import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const expiresDays = Number(process.env.JWT_EXPIRES_DAYS || 7);

export async function signAuthToken(payload: { sub: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresDays}d`)
    .sign(secret);
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; email: string; iat: number; exp: number };
}

export function authCookie(token: string) {
  const maxAge = expiresDays * 24 * 60 * 60;
  return `auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${
    process.env.NODE_ENV === "production" ? "Secure;" : ""
  }`;
}

export function clearAuthCookie() {
  return `auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${
    process.env.NODE_ENV === "production" ? "Secure;" : ""
  }`;
}
