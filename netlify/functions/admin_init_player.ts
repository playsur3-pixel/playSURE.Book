import type { Handler } from "@netlify/functions";
import { connectLambda, getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import { json } from "./_utils";

/**
 * Create a user via admin secret header.
 * PowerShell client example:
 *  $admin = "..."
 *  $uri   = "https://<site>/.netlify/functions/admin_init_player"
 *  $body = @{ pseudo="playSURE"; password="romainlg" } | ConvertTo-Json
 *  Invoke-RestMethod -Method Post -Uri $uri -Headers @{ "x-admin-secret" = $admin } -ContentType "application/json" -Body $body
 */
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

export const handler: Handler = async (event) => {
  // Ensure Netlify Blobs environment is configured in Lambda compatibility mode
  connectLambda(event as any);

  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

    const headerSecret = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
    if (!ADMIN_SECRET) return json(500, { error: "ADMIN_SECRET not configured" });
    if (!headerSecret || headerSecret !== ADMIN_SECRET) return json(401, { error: "Unauthorized" });

    const body = event.body ? JSON.parse(event.body) : null;
    const pseudo = body?.pseudo?.trim();
    const password = body?.password;

    if (!pseudo || !password) return json(400, { error: "Missing pseudo/password" });

    const store = getStore("playsure-auth");
    const usersKey = "users.json";
    const raw = await store.get(usersKey).catch(() => null);
    const users = raw ? JSON.parse(raw as string) : {};

    if (users[pseudo]) return json(409, { error: "User already exists" });

    users[pseudo] = {
      username: pseudo,
      passwordHash: await bcrypt.hash(password, 10),
      role: "user",
      createdAt: new Date().toISOString(),
    };

    await store.set(usersKey, JSON.stringify(users));

    return json(200, { ok: true, username: pseudo });
  } catch (e: any) {
    return json(500, { error: e?.message || "Server error" });
  }
};
