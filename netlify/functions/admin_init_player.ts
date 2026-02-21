import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import { json } from "./_utils";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

type UsersDb = Record<
  string,
  { username: string; passwordHash: string; role: "user" | "admin"; createdAt: string }
>;

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const headerSecret = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
    if (!ADMIN_SECRET) return json(500, { error: "ADMIN_SECRET not configured" });
    if (!headerSecret || headerSecret !== ADMIN_SECRET) return json(401, { error: "Unauthorized" });

    const body = event.body ? JSON.parse(event.body) : null;
    const pseudo = String(body?.pseudo ?? "").trim();
    const password = String(body?.password ?? "");

    if (!pseudo || !password) return json(400, { error: "Missing pseudo/password" });

    const store = getStore("playsure-auth");
    const usersKey = "users.json";

    // ✅ lecture JSON via type:"json" (pas de getJSON)
    const users = (await store.get(usersKey, { type: "json" }).catch(() => ({}))) as UsersDb;

    if (users[pseudo]) return json(409, { error: "User already exists" });

    users[pseudo] = {
      username: pseudo,
      passwordHash: await bcrypt.hash(password, 10),
      role: "user",
      createdAt: new Date().toISOString(),
    };

    // ✅ écriture JSON
    await store.setJSON(usersKey, users);

    return json(200, { ok: true, username: pseudo });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};