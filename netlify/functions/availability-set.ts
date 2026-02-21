import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import jwt from "jsonwebtoken";
import { getCookie, json } from "./_utils";
import whitelist from "./whitelist.json";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";

const MIN_HOUR = 17;
const MAX_HOUR = 22; // dernier slot = 22-23

type UserFile = {
  version: 1;
  user: string;            // display name
  updatedAt: string;
  available: string[];     // ["YYYY-MM-DD|17", ...]
};

type Slot = { a: string[] };

function normUserKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
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

function getAllowedUsers(): string[] {
  const allowed = (whitelist as any)?.allowed;
  return Array.isArray(allowed) ? allowed.map((x: any) => String(x).trim()).filter(Boolean) : [];
}

async function computeSlot(store: any, slotKey: string, allowedUsers: string[]): Promise<Slot> {
  const a: string[] = [];
  for (const u of allowedUsers) {
    const key = userBlobKey(u);
    const uf = (await store.get(key, { type: "json" }).catch(() => null)) as any;
    if (!uf) continue;

    const avail = toStringArray(uf.available);
    if (avail.includes(slotKey)) {
      a.push(String(uf.user || u));
    }
  }
  a.sort((x, y) => x.localeCompare(y, "fr"));
  return { a };
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    // Auth
    const token = getCookie(event.headers.cookie, COOKIE_NAME);
    if (!token) return json(401, { error: "Not authenticated" });

    let username = "";
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      username = String(decoded?.sub || "").trim();
    } catch {
      return json(401, { error: "Invalid token" });
    }
    if (!username) return json(401, { error: "Invalid token payload" });

    // Whitelist (bloque toute écriture si pas autorisé)
    const allowedUsers = getAllowedUsers();
    const allowedSet = new Set(allowedUsers.map((u) => u.trim().toLowerCase()));
    if (!allowedSet.has(username.toLowerCase())) {
      return json(403, { error: "User not whitelisted" });
    }

    // Body
    const body = event.body ? JSON.parse(event.body) : null;
    const slotKey: string = String(body?.slotKey ?? "").trim();

    // support legacy {state:"available"|"clear"} + new {available:boolean}
    let available: boolean | undefined = body?.available;
    if (typeof available !== "boolean") {
      const state = body?.state;
      if (state === "available") available = true;
      if (state === "clear") available = false;
    }

    if (!slotKey) return json(400, { error: "Missing slotKey" });
    if (typeof available !== "boolean") return json(400, { error: "Missing available boolean" });
    if (!isValidSlotKey(slotKey)) return json(400, { error: "Invalid slotKey" });

    const store = getStore(STORE_NAME);

    // Read user file
    const key = userBlobKey(username);
    const current = (await store.get(key, { type: "json" }).catch(() => null)) as any;

    const file: UserFile = {
      version: 1,
      user: username,
      updatedAt: new Date().toISOString(),
      available: [],
    };

    if (current) {
      file.user = String(current.user || username);
      file.available = toStringArray(current.available).filter(isValidSlotKey);
    }

    const set = new Set<string>(file.available);
    if (available) set.add(slotKey);
    else set.delete(slotKey);

    file.available = Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
    file.updatedAt = new Date().toISOString();

    // Write user file (pas de conflit avec les autres users)
    await store.setJSON(key, file);

    // Renvoie le slot reconstruit (pour l’UI instant)
    const slot = await computeSlot(store, slotKey, allowedUsers);

    return json(200, {
      ok: true,
      slotKey,
      slot,
      updatedAt: file.updatedAt,
      store: STORE_NAME,
    });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};