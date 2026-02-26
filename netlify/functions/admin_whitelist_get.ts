import type { Handler } from "@netlify/functions";
import { json } from "./_utils";
import { readWhitelist } from "./_whitelist";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type, x-admin-secret",
        "access-control-allow-methods": "GET, OPTIONS",
      }, body: "" };
    }

    if (event.httpMethod !== "GET") return json(405, { error: "Method Not Allowed" });

    const headerSecret = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
    if (!ADMIN_SECRET) return json(500, { error: "ADMIN_SECRET not configured" });
    if (!headerSecret || headerSecret !== ADMIN_SECRET) return json(401, { error: "Unauthorized" });

    const wl = await readWhitelist(event);
    return json(200, { ok: true, whitelist: wl });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
