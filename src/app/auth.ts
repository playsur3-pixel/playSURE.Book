export type Me = { authenticated: boolean; username?: string; role?: string };

export async function apiMe(): Promise<Me> {
  const r = await fetch("/.netlify/functions/auth-me", { credentials: "include", cache: "no-store" });
  return r.json();
}

export async function apiLogin(username: string, password: string) {
  const r = await fetch("/.netlify/functions/auth-login", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || "Login failed");
  }
  return r.json();
}

export async function apiLogout() {
  await fetch("/.netlify/functions/auth-logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
}

/* =========================
   Availability (dispo only)
   ========================= */

export type AvailabilitySlot = { a: string[] };

export type AvailabilityData = {
  version: 1;
  updatedAt: string;
  slots: Record<string, AvailabilitySlot>;
};

export async function apiAvailabilityGet(): Promise<AvailabilityData> {
  const r = await fetch("/.netlify/functions/availability-get", {
    credentials: "include",
    cache: "no-store",
    headers: { "cache-control": "no-store" },
  });

  const j = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error(j?.error || "availability-get failed");

  const data = (j?.data || null) as AvailabilityData | null;
  return data || { version: 1, updatedAt: new Date().toISOString(), slots: {} };
}

export async function apiAvailabilitySet(slotKey: string, available: boolean) {
  const r = await fetch("/.netlify/functions/availability-set", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify({ slotKey, available }),
  });

  const j = await r.json().catch(() => ({} as any));
  if (!r.ok) throw new Error(j?.error || "availability-set failed");

  return j as { ok: boolean; slotKey: string; slot: AvailabilitySlot | null; updatedAt: string };
}
