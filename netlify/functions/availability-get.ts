import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { json } from "./_utils";

type Slot = { a: string[] }; // dispo uniquement
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

const KEY = "availability.json";

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getStore("playsure-schedule");
    const raw = await store.get(KEY).catch(() => null);

    // Backward compatible read: if old slot has {a,u}, keep only a
    const parsed = raw ? JSON.parse(raw as string) : null;
    const slotsIn = (parsed?.slots ?? {}) as Record<string, any>;

    const slots: Record<string, Slot> = {};
    for (const [k, v] of Object.entries(slotsIn)) {
      const a = Array.isArray(v?.a) ? v.a : [];
      if (a.length) slots[k] = { a: a.map(String) };
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
