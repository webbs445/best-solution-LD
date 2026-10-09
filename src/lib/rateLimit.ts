/*
  Small in-memory sliding-window rate limiter for the lead API routes. It is per server instance (not
  shared across instances), which is enough to stop casual abuse; the honeypot and number validation do
  the rest.
*/

const hits = new Map<string, number[]>();

/** True if this call is allowed (and counts it); false once `limit` calls happened within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map small: drop keys whose calls have all aged out.
  if (hits.size > 5000) for (const [k, ts] of hits) if (!ts.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

/** The visitor's IP as seen by the server (first X-Forwarded-For entry behind a proxy). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
}
