import type { HandlerEvent } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";

export type WhitelistEntry = { name: string; role: string };
export type WhitelistDoc = { users: WhitelistEntry[] };

const STORE_NAME = process.env.AUTH_STORE_NAME || "playsure-auth";
const KEY = process.env.AUTH_WHITELIST_KEY || "whitelist.json";

function norm(s: string) {
  return String(s || "").trim().toLowerCase();
}

export function getAuthStore(event: HandlerEvent) {
  // Required when running in Lambda compatibility mode
  connectLambda(event as any);
  return getStore(STORE_NAME);
}

export async function readWhitelist(event: HandlerEvent): Promise<WhitelistDoc> {
  const store = getAuthStore(event);
  const raw = await store.get(KEY, { type: "json" }).catch(() => null);

  if (raw && typeof raw === "object" && Array.isArray((raw as any).users)) {
    // sanitize
    const users = (raw as any).users
      .map((u: any) => ({ name: String(u?.name ?? "").trim(), role: String(u?.role ?? "player").trim() }))
      .filter((u: any) => u.name);
    return { users };
  }
  return { users: [] };
}

export async function isWhitelisted(event: HandlerEvent, username: string): Promise<{ ok: boolean; role: string }> {
  const wl = await readWhitelist(event);
  const u = norm(username);
  const entry = wl.users.find((x) => norm(x.name) === u);
  return { ok: !!entry, role: norm(entry?.role || "player") || "player" };
}

export async function upsertWhitelistUser(event: HandlerEvent, username: string, role: string) {
  const store = getAuthStore(event);
  const wl = await readWhitelist(event);

  const u = String(username || "").trim();
  const r = String(role || "player").trim();

  const idx = wl.users.findIndex((x) => norm(x.name) === norm(u));
  if (idx >= 0) wl.users[idx] = { name: u, role: r };
  else wl.users.push({ name: u, role: r });

  // stable order for diffs
  wl.users = wl.users
    .map((x) => ({ name: x.name.trim(), role: x.role.trim() }))
    .filter((x) => x.name)
    .sort((a, b) => norm(a.name).localeCompare(norm(b.name)));

  await store.setJSON(KEY, wl);
  return wl;
}

export async function removeWhitelistUser(event: HandlerEvent, username: string) {
  const store = getAuthStore(event);
  const wl = await readWhitelist(event);
  const u = norm(username);
  wl.users = wl.users.filter((x) => norm(x.name) !== u);
  await store.setJSON(KEY, wl);
  return wl;
}
