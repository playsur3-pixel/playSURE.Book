import type { Handler } from "@netlify/functions";
import { json } from "./_utils";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "playsure_token";

export const handler: Handler = async () => {
  const secure = process.env.NODE_ENV === "production" ? "Secure; " : "";
  return json(200, { ok: true }, {
    "set-cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; ${secure}Max-Age=0`,
  });
};
