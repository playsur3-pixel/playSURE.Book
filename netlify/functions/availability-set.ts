import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import jwt from "jsonwebtoken";
import { getCookie, json } from "./_utils";

type Slot = { a: string[] };
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

const KEY = "availability.json";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

type State = "available" | "clear";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseSlotKey(slotKey: string) {
  // format: YYYY-MM-DD|17 .. |23
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{2})$/.exec(slotKey);
  if (!m) return null;
  const hour = Number(m[2]);
  if (hour < 17 || hour > 23) return null;
  return { date: m[1], hour: pad(hour) };
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const token = getCookie(event.headers.cookie, COOKIE_NAME);
    if (!token) return json(401, { error: "Not authenticated" });

    let username = "";
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      username = String(decoded?.sub || "");
    } catch {
      return json(401, { error: "Invalid token" });
    }
    if (!username) return json(401, { error: "Invalid token payload" });

    const body = event.body ? JSON.parse(event.body) : null;
    const slotKey: string = body?.slotKey;
    const state: State = body?.state;

    if (!slotKey || !state) return json(400, { error: "Missing slotKey/state" });
    if (!["available", "clear"].includes(state)) return json(400, { error: "Invalid state" });

    if (!parseSlotKey(slotKey)) return json(400, { error: "Invalid slotKey format" });

    const store = getStore("playsure-schedule");
    const raw = await store.get(KEY).catch(() => null);

    // Backward compatible load
    const parsed = raw ? JSON.parse(raw as string) : null;
    const slotsIn = (parsed?.slots ?? {}) as Record<string, any>;

    const data: Data = {
      version: 1,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
      slots: {},
    };

    // normalize old -> new
    for (const [k, v] of Object.entries(slotsIn)) {
      const a = Array.isArray(v?.a) ? v.a.map(String) : [];
      if (a.length) data.slots[k] = { a };
    }

    const current = data.slots[slotKey] ?? { a: [] };
    const a = new Set(current.a);

    // toggle for this user
    a.delete(username);
    if (state === "available") a.add(username);

    const next: Slot = Array.from(a).length ? { a: Array.from(a).sort((x, y) => x.localeCompare(y)) } : { a: [] };

    if (next.a.length === 0) delete data.slots[slotKey];
    else data.slots[slotKey] = next;

    data.updatedAt = new Date().toISOString();
    await store.set(KEY, JSON.stringify(data));

    return json(200, { ok: true, slotKey, slot: data.slots[slotKey] ?? { a: [] } });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
