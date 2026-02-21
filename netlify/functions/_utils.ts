export function json(statusCode: number, body: any, extraHeaders: Record<string,string> = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function getCookie(header: string | undefined, name: string) {
  if (!header) return null;
  const part = header.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
  return part ? decodeURIComponent(part.split("=").slice(1).join("=")) : null;
}
