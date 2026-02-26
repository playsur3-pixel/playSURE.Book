import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { json } from "./_utils";

const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";
const AUTH_STORE = process.env.AUTH_STORE || "playsure-auth";

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

type UsersDb = Record<string, { username: string; role?: string; passwordHash: string; createdAt?: string }>;

function norm(s: string) {
  return String(s || "").trim().toLowerCase();
}

function specialRole(username: string): string | null {
  const u = norm(username);
  if (u === "playsure") return "coach";
  if (u === "kr4toss_") return "director";
  return null;
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

async function listUserFiles(store: any): Promise<string[]> {
  // @netlify/blobs: store.list({ prefix })
  const res = await (store as any).list?.({ prefix: "availability/users/" }).catch(() => null);
  const blobs = (res?.blobs || res?.items || res || []) as any[];
  const keys = blobs
    .map((b: any) => String(b?.key ?? b?.name ?? b ?? ""))
    .filter((k) => k.startsWith("availability/users/") && k.endsWith(".json"));
  // Dédup
  return Array.from(new Set(keys));
}

async function readRoles(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const store = getStore(AUTH_STORE);
  const raw = await store.get("users.json", { type: "json" }).catch(() => null);
  const users: UsersDb = raw && typeof raw === "object" ? (raw as UsersDb) : {};

  for (const u of Object.values(users)) {
    const name = String(u?.username || "").trim();
    if (!name) continue;
    out[norm(name)] = specialRole(name) || norm(u.role || "player");
  }

  // Assure les overrides même si pas dans users.json
  out["playsure"] = "coach";
  out["kr4toss_"] = "director";

  return out;
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getStore(STORE_NAME);
    const keys = await listUserFiles(store);

    const slots: Record<string, Slot> = {};
    let latest = 0;

    for (const key of keys) {
      const uf = (await store.get(key, { type: "json" }).catch(() => null)) as any;
      if (!uf) continue;

      const file = uf as UserFile;
      const display = String(file.user || "").trim();
      if (!display) continue;

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

    const roles = await readRoles();

    return json(200, { ok: true, data, roles, store: STORE_NAME });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
