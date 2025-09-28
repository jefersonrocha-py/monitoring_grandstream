export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  let text = "";
  try { text = await res.clone().text(); } catch {}

  if (!res.ok) {
    let msg = `HTTP ${res.status} ${res.statusText} for ${path}`;
    try {
      const j = JSON.parse(text);
      if (j?.error) msg = `${msg} — ${j.error}`;
    } catch {}
    throw new Error(msg);
  }

  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new Error(`Invalid JSON response for ${path}: ${text.slice(0, 200)}`);
  }
}
