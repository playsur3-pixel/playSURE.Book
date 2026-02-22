import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { json } from "./_utils";
import whitelist from "./whitelist.json";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

type UsersDb = Record<string, { username: string; passwordHash: string; role?: string }>;

function makeCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=${60 * 60 * 24 * 7}`;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function getWhitelist() {
  const wlUsersRaw = (whitelist as any)?.users;
  const wlUsers: Array<{ name: string; role?: string }> = Array.isArray(wlUsersRaw)
    ? wlUsersRaw.map((u: any) => ({ name: String(u?.name ?? "").trim(), role: String(u?.role ?? "").trim() }))
    : [];

  const allowed = wlUsers.map((u) => u.name).filter(Boolean);
  const roles: Record<string, string> = {};
  for (const u of wlUsers) {
    if (!u.name) continue;
    roles[norm(u.name)] = norm(u.role || "player");
  }

  return { allowed, roles };
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const body = event.body ? JSON.parse(event.body) : null;
    const usernameInput = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    if (!usernameInput || !password) return json(400, { error: "Missing credentials" });

    // ✅ Whitelist via whitelist.users[]
    const { allowed, roles } = getWhitelist();
    const allowedSet = new Set(allowed.map(norm));
    if (!allowedSet.has(norm(usernameInput))) {
      return json(403, { error: "User not whitelisted" });
    }

    const store = getStore("playsure-auth");
    const users = (await store.get("users.json", { type: "json" }).catch(() => ({}))) as UsersDb;

    // exact match puis case-insensitive
    let user = users[usernameInput];
    if (!user) {
      const key = Object.keys(users).find((k) => norm(k) === norm(usernameInput));
      if (key) user = users[key];
    }
    if (!user) return json(401, { error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return json(401, { error: "Invalid credentials" });

    // ✅ rôle = whitelist (source de vérité)
    const role = roles[norm(user.username)] || "player";

    const token = jwt.sign({ sub: user.username, role }, JWT_SECRET, { expiresIn: "7d" });

    return json(
      200,
      { ok: true, username: user.username, role },
      { "set-cookie": makeCookie(token) }
    );
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};