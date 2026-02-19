export type Me = { authenticated: boolean; username?: string; role?: string };

export async function apiMe(): Promise<Me> {
  const r = await fetch("/.netlify/functions/auth-me", { credentials: "include" });
  return r.json();
}

export async function apiLogin(username: string, password: string) {
  const r = await fetch("/.netlify/functions/auth-login", {
    method: "POST",
    credentials: "include",
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
  await fetch("/.netlify/functions/auth-logout", { method: "POST", credentials: "include" });
}

export type AvailabilitySlot = { a: string[]; u: string[] };
export type AvailabilityData = {
  version: 1;
  updatedAt: string;
  slots: Record<string, AvailabilitySlot>;
};

export async function apiAvailabilityGet(): Promise<AvailabilityData & { ok: boolean }> {
  const r = await fetch("/.netlify/functions/availability-get", { credentials: "include" });
  if (!r.ok) throw new Error("availability-get failed");
  return r.json();
}

export async function apiAvailabilitySet(slotKey: string, state: "available" | "unavailable" | "clear") {
  const r = await fetch("/.netlify/functions/availability-set", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slotKey, state }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "availability-set failed");
  return j as { ok: boolean; slotKey: string; slot: AvailabilitySlot };
}
