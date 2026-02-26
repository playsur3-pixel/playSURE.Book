import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { json } from "./_utils";

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

function specialRole(username: string): string | null {
  const u = norm(username);
  if (u === "playsure") return "coach";
  if (u === "kr4toss_") return "director";
  return null;
}

export const handler: Handler = async (event) => {
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const body = event.body ? JSON.parse(event.body) : null;
    const usernameInput = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    if (!usernameInput || !password) return json(400, { error: "Missing credentials" });

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

    // rôle = stocké sur le user (ou override par pseudo spécial)
    const role = specialRole(user.username) || norm(user.role || "player");

    const token = jwt.sign({ sub: user.username, role }, JWT_SECRET, { expiresIn: "7d" });

    return json(200, { ok: true, username: user.username, role }, { "set-cookie": makeCookie(token) });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};