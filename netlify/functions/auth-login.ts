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
  { username: string; passwordHash: string; role: "user" | "admin"; createdAt?: string }
>;

function makeCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=${60 * 60 * 24 * 7}`;
}

function norm(s: string) {
  return s.trim().toLowerCase();
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
    const allowed = new Set((whitelist as any)?.allowed?.map((u: string) => norm(u)) ?? []);
    if (!allowed.has(norm(usernameInput))) {
      return json(403, { error: "User not whitelisted" });
    }

    const store = getStore("playsure-auth");

    // ✅ lecture JSON via type:"json"
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

    const token = jwt.sign({ sub: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return json(
      200,
      { ok: true, username: user.username, role: user.role },
      { "set-cookie": makeCookie(token) }
    );
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};