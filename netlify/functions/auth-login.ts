import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { json } from "./_utils";
import whitelist from "./whitelist.json";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

type UsersDb = Record<
  string,
  { username: string; passwordHash: string; role?: string; createdAt?: string }
>;

function makeCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=${60 * 60 * 24 * 7}`;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function readWhitelist(): { allowed: string[]; roles: Record<string, string> } {
  const usersRaw = (whitelist as any)?.users;

  if (Array.isArray(usersRaw)) {
    const users = usersRaw
      .map((u: any) => ({
        name: String(u?.name ?? "").trim(),
        role: String(u?.role ?? "player").trim(),
      }))
      .filter((u: any) => u.name);

    const allowed = users.map((u: any) => u.name);
    const roles: Record<string, string> = {};
    for (const u of users) roles[norm(u.name)] = norm(u.role || "player");
    return { allowed, roles };
  }

  // fallback ancien format si besoin
  const allowed = Array.isArray((whitelist as any)?.allowed)
    ? (whitelist as any).allowed.map((x: any) => String(x).trim()).filter(Boolean)
    : [];

  const rolesObj = ((whitelist as any)?.roles ?? {}) as Record<string, any>;
  const roles: Record<string, string> = {};
  for (const [k, v] of Object.entries(rolesObj)) roles[norm(k)] = norm(String(v));
  for (const u of allowed) if (!roles[norm(u)]) roles[norm(u)] = "player";

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

    // ✅ Whitelist
    const { allowed, roles } = readWhitelist();
    const allowedSet = new Set(allowed.map(norm));
    if (!allowedSet.has(norm(usernameInput))) {
      return json(403, { error: "User not whitelisted" });
    }

    const store = getStore("playsure-auth");

    // ✅ IMPORTANT : store.get peut renvoyer null sans throw
    const raw = await store.get("users.json", { type: "json" }).catch(() => null);
    const users: UsersDb = (raw && typeof raw === "object") ? (raw as UsersDb) : {};

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

    return json(200, { ok: true, username: user.username, role }, { "set-cookie": makeCookie(token) });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};