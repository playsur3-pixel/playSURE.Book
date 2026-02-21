import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { json } from "./_utils";

type Slot = { a: string[] };
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";
const KEY = "availability.json";

const MIN_HOUR = 17;
const MAX_HOUR = 22;

function isValidSlotKey(slotKey: string) {
  const m = /^(\d{4}-\d{2}-\d{2})\|(\d{1,2})$/.exec(slotKey);
  if (!m) return false;
  const datePart = m[1];
  const hour = Number(m[2]);
  if (!Number.isInteger(hour) || hour < MIN_HOUR || hour > MAX_HOUR) return false;
  const d = new Date(`${datePart}T12:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === datePart;
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((x) => String(x).trim()).filter((s) => s.length > 0);
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getStore(STORE_NAME);

    // ✅ await uniquement ici
    const parsed = (await store.get(KEY, { type: "json" }).catch(() => null)) as any;

    const slotsIn = (parsed?.slots ?? {}) as Record<string, any>;
    const slots: Record<string, Slot> = {};

    for (const [k, v] of Object.entries(slotsIn)) {
      if (!isValidSlotKey(k)) continue;
      const cleaned = toStringArray(v?.a);
      const uniq = Array.from(new Set(cleaned)).sort((aa, bb) => aa.localeCompare(bb, "fr"));
      if (uniq.length) slots[k] = { a: uniq };
    }

    const data: Data = {
      version: 1,
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      slots,
    };

    return json(200, { ok: true, data, store: STORE_NAME });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};