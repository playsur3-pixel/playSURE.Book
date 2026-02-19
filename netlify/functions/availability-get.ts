import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import { json } from "./_utils";

type Slot = { a: string[]; u: string[] }; // a=available, u=unavailable
type Data = { version: 1; updatedAt: string; slots: Record<string, Slot> };

const KEY = "availability.json";

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const store = getStore("playsure-schedule");
    const raw = await store.get(KEY).catch(() => null);

    const data: Data =
      raw
        ? (JSON.parse(raw as string) as Data)
        : { version: 1, updatedAt: new Date().toISOString(), slots: {} };

    return json(200, { ok: true, ...data });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
