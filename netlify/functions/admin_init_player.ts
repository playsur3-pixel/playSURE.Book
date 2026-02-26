import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import { json } from "./_utils";
import { upsertWhitelistUser } from "./_whitelist";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

// ✅ Rôles autorisés (adapte si tu veux)
type Role = "coach" | "player" | "director" | "admin";

type UsersDb = Record<
  string,
  { username: string; passwordHash: string; role: Role; createdAt: string }
>;

function normalizeRole(input: unknown): Role {
  const r = String(input ?? "").trim().toLowerCase();
  if (r === "coach" || r === "player" || r === "director" || r === "admin") return r;
  return "player"; // défaut
}

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
    const role = normalizeRole(body?.role); // ✅ role depuis le script

    if (!pseudo || !password) return json(400, { error: "Missing pseudo/password" });

    const store = getStore("playsure-auth");
    const usersKey = "users.json";

    // Lecture JSON
    // const users = (await store.get(usersKey, { type: "json" }).catch(() => ({}))) as UsersDb;
    const raw = await store.get(usersKey, { type: "json" }).catch(() => null);
    const users: UsersDb = (raw && typeof raw === "object") ? (raw as UsersDb) : {};

    if (users[pseudo]) return json(409, { error: "User already exists" });

    users[pseudo] = {
      username: pseudo,
      passwordHash: await bcrypt.hash(password, 10),
      role, // ✅ stocké
      createdAt: new Date().toISOString(),
    };

    await store.setJSON(usersKey, users);

    // ✅ Auto-whitelist (stored in Netlify Blobs)
    await upsertWhitelistUser(event, pseudo, role);

    return json(200, { ok: true, username: pseudo, role });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};