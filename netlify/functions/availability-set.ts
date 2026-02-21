import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import jwt from "jsonwebtoken";
import { json } from "./_utils";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

const STORE_NAME = process.env.AVAILABILITY_STORE || "playsure-schedule";
const KEY = "availability.json";

const MIN_HOUR = 17;
const MAX_HOUR = 22;

type AvailabilitySlot = { a: string[] };
type AvailabilityData = {
  version: 1;
  updatedAt: string;
  slots: Record<string, AvailabilitySlot>;
};

function parseCookies(cookieHeader: string | undefined) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

function getUsernameFromAuth(event: any): string | null {
  const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const sub = payload?.sub;
    return typeof sub === "string" && sub.trim() ? sub.trim() : null;
  } catch {
    return null;
  }
}

function defaultData(): AvailabilityData {
  return { version: 1, updatedAt: new Date().toISOString(), slots: {} };
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
  return input
    .map((x) => String(x).trim())
    .filter((s) => s.length > 0);
}

function cleanSlots(slots: Record<string, AvailabilitySlot>) {
  const out: Record<string, AvailabilitySlot> = {};

  for (const [k, v] of Object.entries(slots || {})) {
    if (!isValidSlotKey(k)) continue;

    const cleaned = toStringArray((v as any)?.a);
    const uniq = Array.from(new Set(cleaned)).sort((aa: string, bb: string) =>
      aa.localeCompare(bb, "fr")
    );

    if (uniq.length) out[k] = { a: uniq };
  }

  return out;
}

function isPreconditionConflict(err: any) {
  const status = err?.status ?? err?.statusCode ?? err?.response?.status;
  if (status === 412) return true;

  const msg = String(err?.message || "");
  const name = String(err?.name || "");
  return (
    name.toLowerCase().includes("precondition") ||
    msg.toLowerCase().includes("precondition") ||
    msg.toLowerCase().includes("onlyifmatch") ||
    msg.toLowerCase().includes("etag")
  );
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const username = getUsernameFromAuth(event);
    if (!username) return json(401, { error: "Unauthorized" });

    const body = event.body ? JSON.parse(event.body) : null;
    const slotKey: string | undefined = body?.slotKey;

    // accepte ancien format (state) + nouveau (available)
    let available: boolean | undefined = body?.available;
    if (typeof available !== "boolean") {
      const state = body?.state;
      if (state === "available") available = true;
      if (state === "clear") available = false;
    }

    if (!slotKey || typeof slotKey !== "string") return json(400, { error: "Missing slotKey" });
    if (typeof available !== "boolean") return json(400, { error: "Missing available boolean" });
    if (!isValidSlotKey(slotKey)) return json(400, { error: "Invalid slotKey" });

    const store = getStore(STORE_NAME);
    const maxRetries = 10;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const entry = await store
        .getWithMetadata(KEY, { type: "json", consistency: "strong" })
        .catch(() => null);

      const current: AvailabilityData = (entry?.data as any) || defaultData();
      const etag: string | undefined = entry?.etag;

      const next: AvailabilityData = {
        version: 1,
        updatedAt: new Date().toISOString(),
        slots: cleanSlots(current.slots || {}),
      };

      // ✅ Set<string> garanti
      const existing = next.slots[slotKey]?.a ?? [];
      const set = new Set<string>(toStringArray(existing));

      if (available) set.add(username);
      else set.delete(username);

      const arr = Array.from(set).sort((aa: string, bb: string) => aa.localeCompare(bb, "fr"));

      if (arr.length === 0) delete next.slots[slotKey];
      else next.slots[slotKey] = { a: arr };

      const writeOpts = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };

      try {
        await store.setJSON(KEY, next, writeOpts as any);

        return json(200, {
          ok: true,
          slotKey,
          slot: next.slots[slotKey] || null,
          updatedAt: next.updatedAt,
          store: STORE_NAME,
        });
      } catch (err: any) {
        if (isPreconditionConflict(err)) {
          await new Promise((r) => setTimeout(r, 30 + attempt * 40));
          continue;
        }
        throw err;
      }
    }

    return json(409, { error: "Concurrent update, please retry" });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};