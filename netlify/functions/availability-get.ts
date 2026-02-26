import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { json } from "./_utils";
import whitelist from "./whitelist.json";

const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";

const MIN_HOUR = 17;
const MAX_HOUR = 22;

type Slot = { a: string[] };
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

type UserFile = {
  version: 1;
  user: string;
  updatedAt: string;
  available: string[];
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function normUserKey(name: string) {
  return norm(name).replace(/[^a-z0-9_-]+/g, "_");
}

function userBlobKey(displayName: string) {
  return `availability/users/${normUserKey(displayName)}.json`;
}

function isValidSlotKey(slotKey: string): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{1,2})$/.exec(slotKey);
  if (!m) return false;

  const datePart = m[1];
  const hour = Number(m[2]);
  if (!Number.isInteger(hour) || hour < MIN_HOUR || hour > MAX_HOUR) return false;

  const d = new Date(`${datePart}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === datePart;
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => String(x).trim()).filter((s) => s.length > 0);
}

/**
 * Supporte:
 * - Nouveau format: { users: [ { name, role } ] }
 * - Ancien format: { allowed: [...], roles: {...} }
 */
function readWhitelist() {
  const usersRaw = (whitelist as any)?.users;

  // ✅ Nouveau format
  if (Array.isArray(usersRaw)) {
    const users = usersRaw
      .map((u: any) => ({
        name: String(u?.name ?? "").trim(),
        role: String(u?.role ?? "player").trim(),
      }))
      .filter((u: any) => u.name);

    const allowed = users.map((u: any) => u.name);

    const roles: Record<string, string> = {};
    for (const u of users) {
      roles[norm(u.name)] = norm(u.role || "player");
    }

    return { allowed, roles };
  }

  // ✅ Fallback ancien format
  const allowed = Array.isArray((whitelist as any)?.allowed)
    ? (whitelist as any).allowed.map((x: any) => String(x).trim()).filter(Boolean)
    : [];

  const rolesObj = ((whitelist as any)?.roles ?? {}) as Record<string, any>;
  const roles: Record<string, string> = {};
  for (const [k, v] of Object.entries(rolesObj)) roles[norm(k)] = norm(String(v));
  for (const u of allowed) if (!roles[norm(u)]) roles[norm(u)] = "player";

  return { allowed, roles };
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getStore(STORE_NAME);
    const { allowed, roles } = readWhitelist();

    const slots: Record<string, Slot> = {};
    let latest = 0;

    // ✅ C’EST ICI que va la boucle "for (const wlName of allowed)"
    for (const wlName of allowed) {
      const key = userBlobKey(wlName);
      const uf = (await store.get(key, { type: "json" }).catch(() => null)) as any;
      if (!uf) continue;

      const file = uf as UserFile;
      const display = String(file.user || wlName);

      const t = Date.parse(String(file.updatedAt || ""));
      if (!Number.isNaN(t)) latest = Math.max(latest, t);

      const avail = toStringArray(file.available).filter(isValidSlotKey);
      for (const sk of avail) {
        if (!slots[sk]) slots[sk] = { a: [] };
        slots[sk].a.push(display);
      }
    }

    for (const s of Object.values(slots)) {
      s.a = Array.from(new Set(s.a)).sort((a, b) => a.localeCompare(b, "fr"));
    }

    const data: Data = {
      version: 1,
      updatedAt: latest ? new Date(latest).toISOString() : new Date().toISOString(),
      slots,
    };

    // ✅ roles: mapping avec clés en lower-case
    return json(200, { ok: true, data, roles, store: STORE_NAME });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};