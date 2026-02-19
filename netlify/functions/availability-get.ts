import type { Handler } from "@netlify/functions";
import { json } from "./_utils";
import { getBlobsStore } from "./_blobs";

type Slot = { a: string[] };
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

const KEY = "availability.json";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getBlobsStore(event, "playsure-schedule");
    const raw = await store.get(KEY).catch(() => null);

    const parsed = raw ? JSON.parse(raw as string) : null;
    const slotsIn = (parsed?.slots ?? {}) as Record<string, any>;

    // compat: si ancien format {a,u}, on garde seulement a
    const slots: Record<string, Slot> = {};
    for (const [k, v] of Object.entries(slotsIn)) {
      const a = Array.isArray(v?.a) ? v.a.map(String) : [];
      if (a.length) slots[k] = { a };
    }

    const data: Data = {
      version: 1,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
      slots,
    };

    return json(200, { ok: true, ...data });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
