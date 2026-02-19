import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { json } from "./_utils";

type Slot = { a: string[] };
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

const KEY = "availability.json";
const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";

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
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getStore(STORE_NAME);
    const raw = await store.get(KEY).catch(() => null);

    const parsed = raw ? JSON.parse(raw as string) : null;
    const slotsIn = (parsed?.slots ?? {}) as Record<string, any>;

    // ✅ Compat ancien format + filtre heures
    const slots: Record<string, Slot> = {};
    for (const [k, v] of Object.entries(slotsIn)) {
      if (!isValidSlotKey(k)) continue; // ignore les vieux 23|00h etc.
      const a = Array.isArray(v?.a) ? v.a.map(String) : [];
      if (a.length) slots[k] = { a };
    }

    const data: Data = {
      version: 1,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
      slots,
    };

    // ✅ format stable côté front
    return json(200, { ok: true, data });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
