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

function isValidSlotKey(slotKey: string) {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{2})$/.exec(slotKey);
  if (!m) return false;
  const hour = Number(m[2]);
  // ✅ 17..22 seulement (22 => 22-23)
  return hour >= 17 && hour <= 22;
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
    if (!isValidSlotKey(slotKey)) return json(400, { error: "Invalid slotKey format/hour" });

    const store = getStore("playsure-schedule");
    const raw = await store.get(KEY).catch(() => null);

    const parsed = raw ? JSON.parse(raw as string) : null;
    const slotsIn = (parsed?.slots ?? {}) as Record<string, any>;

    // ✅ On recharge/normalise en filtrant tout ce qui n'est pas valide
    const data: Data = {
      version: 1,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
      slots: {},
    };

    for (const [k, v] of Object.entries(slotsIn)) {
      if (!isValidSlotKey(k)) continue;
      const a = Array.isArray(v?.a) ? v.a.map(String) : [];
      if (a.length) data.slots[k] = { a };
    }

    const cur = data.slots[slotKey] ?? { a: [] };
    const a = new Set(cur.a);

    a.delete(username);
    if (state === "available") a.add(username);

    const next = { a: Array.from(a).sort((x, y) => x.localeCompare(y)) };

    if (next.a.length === 0) delete data.slots[slotKey];
    else data.slots[slotKey] = next;

    data.updatedAt = new Date().toISOString();
    await store.set(KEY, JSON.stringify(data));

    return json(200, { ok: true, slotKey, slot: data.slots[slotKey] ?? { a: [] } });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
