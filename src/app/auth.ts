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
