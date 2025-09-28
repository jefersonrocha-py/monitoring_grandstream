import { prisma } from "@lib/prisma";

// Memória local para reduzir IO, mas a verdade fica no DB
type TokenRecord = { accessToken: string; expiresAt: number };
const mem = { token: null as TokenRecord | null };

const SKEW_MS = 60_000; // renova com 1min de antecedência

function now() { return Date.now(); }
function willExpireSoon(expiresAt: number, skewMs = SKEW_MS) {
  return expiresAt <= (now() + skewMs);
}

async function loadFromDb(): Promise<TokenRecord | null> {
  const row = await prisma.gdmsToken.findUnique({ where: { id: 1 } }).catch(() => null);
  if (!row) return null;
  return { accessToken: row.accessToken, expiresAt: new Date(row.expiresAt).getTime() };
}
async function saveToDb(tok: TokenRecord): Promise<void> {
  await prisma.gdmsToken.upsert({
    where: { id: 1 },
    create: { id: 1, accessToken: tok.accessToken, expiresAt: new Date(tok.expiresAt) },
    update: { accessToken: tok.accessToken, expiresAt: new Date(tok.expiresAt) },
  });
  mem.token = tok; // sincroniza cache
}

// === OAuth client_credentials ===
// Equivalente ao seu curl:
// curl -X POST "$GDMS_OAUTH_URL" \
//   -H "Content-Type: application/x-www-form-urlencoded" \
//   --data "grant_type=client_credentials&client_id=...&client_secret=..."
async function fetchClientCredentialsToken(): Promise<TokenRecord> {
  const url = process.env.GDMS_OAUTH_URL!;
  const clientId = process.env.GDMS_CLIENT_ID!;
  const clientSecret = process.env.GDMS_CLIENT_SECRET!;
  if (!url || !clientId || !clientSecret) {
    throw new Error("Configure GDMS_OAUTH_URL, GDMS_CLIENT_ID e GDMS_CLIENT_SECRET.");
  }

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OAuth token failed ${res.status}: ${t}`);
  }
  const json = await res.json();
  const accessToken = json?.access_token ?? json?.token;
  const ttlSec = json?.expires_in ?? 3600;
  if (!accessToken) throw new Error("OAuth token response missing access_token");
  return { accessToken, expiresAt: now() + ttlSec * 1000 };
}

// Renova e persiste
export async function refreshToken(): Promise<TokenRecord> {
  const rec = await fetchClientCredentialsToken();
  await saveToDb(rec);
  return rec;
}

// Exposta para quem precisa do token
export async function getAccessToken(): Promise<string> {
  // 1) memória ok?
  if (mem.token && !willExpireSoon(mem.token.expiresAt)) return mem.token.accessToken;

  // 2) DB
  const dbTok = await loadFromDb();
  if (dbTok && !willExpireSoon(dbTok.expiresAt)) {
    mem.token = dbTok;
    return dbTok.accessToken;
  }

  // 3) renovar via OAuth e salvar
  const newTok = await refreshToken();
  return newTok.accessToken;
}

// Opcional: force refresh via endpoint/admin
export async function forceRefresh() {
  return refreshToken();
}

// Para UI/monitorar (não expõe o token)
export async function getTokenInfo() {
  const dbTok = await loadFromDb();
  const exp = dbTok?.expiresAt ?? 0;
  return {
    hasToken: !!dbTok,
    expiresAt: exp,
    expiresInSec: exp ? Math.max(0, Math.floor((exp - now()) / 1000)) : null,
  };
}
