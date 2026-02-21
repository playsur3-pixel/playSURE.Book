import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { json } from "./_utils";

type Slot = { a: string[] };
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";
const KEY = "availability.json";

// 17->23 => slots start hours: 17..22 (dernier = 22-23)
const MIN_HOUR = 17;
const MAX_HOUR = 22;

function isValidSlotKey(slotKey: string) {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{1,2})$/.exec(slotKey);
  if (!m) return false;

  const datePart = m[1];
  const hour = Number(m[2]);
  if (!Number.isInteger(hour) || hour < MIN_HOUR || hour > MAX_HOUR) return false;

  // Validation date stable
  const d = new Date(`${datePart}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === datePart;
}

export const handler: Handler = async (event) => {
  // ✅ obligatoire pour Blobs en lambda mode
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getStore(STORE_NAME);

    // ✅ strong consistency => refresh = dernière version
    const entry = await store
      .getWithMetadata(KEY, { type: "json", consistency: "strong" })
      .catch(() => null);

    const parsed = (entry?.data as any) || null;
    const slotsIn = (parsed?.slots ?? {}) as Record<string, any>;

    // ✅ normalise + filtre anciennes heures 23/00 etc.
    const slots: Record<string, Slot> = {};
    for (const [k, v] of Object.entries(slotsIn)) {
      if (!isValidSlotKey(k)) continue;
      const a = Array.isArray((v as any)?.a) ? (v as any).a.map(String) : [];
      const uniq = Array.from(new Set(a.map((x) => x.trim()).filter(Boolean))).sort((aa, bb) =>
        aa.localeCompare(bb, "fr")
      );
      if (uniq.length) slots[k] = { a: uniq };
    }

    const data: Data = {
      version: 1,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
      slots,
    };

    // ✅ format stable: { ok, data }
    return json(200, { ok: true, data, etag: entry?.etag || null, store: STORE_NAME });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
