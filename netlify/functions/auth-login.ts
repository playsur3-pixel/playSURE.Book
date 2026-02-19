import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { json } from "./_utils";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

function makeCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=${60 * 60 * 24 * 7}`;
}

export const handler: Handler = async (event) => {
  // Ensure Netlify Blobs environment is configured in Lambda compatibility mode
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });
    const body = event.body ? JSON.parse(event.body) : null;
    const username = body?.username?.trim();
    const password = body?.password;

    if (!username || !password) return json(400, { error: "Missing credentials" });

    const store = getStore("playsure-auth");
    const usersRaw = await store.get("users.json").catch(() => null);
    const users = usersRaw ? JSON.parse(usersRaw as string) : {};
    const user = users[username];
    if (!user) return json(401, { error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return json(401, { error: "Invalid credentials" });

    const token = jwt.sign({ sub: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return json(200, { ok: true, username: user.username, role: user.role }, { "set-cookie": makeCookie(token) });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
