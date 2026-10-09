import { createHmac, timingSafeEqual } from "node:crypto";

/*
  Signed reference to an ERP lead, handed to the browser after the WhatsApp number step so the visitor can
  add their name or email to the SAME lead later. Server-only.
  - Signed with HMAC-SHA256 using a key derived from ERPNEXT_API_SECRET (no extra setting to manage), so the
    browser cannot forge a reference to someone else's lead (ERP lead numbers are sequential).
  - Carries a keyed hash of the phone number (never the number itself), used to recognise the same number
    submitted again in the same visit.
  - Expires after 2 hours.
*/

export const LEAD_REF_TTL_MS = 2 * 60 * 60 * 1000;

interface Payload {
  /** ERP lead name, e.g. BSL-2603251. */
  l: string;
  /** Keyed hash of the E.164 number. */
  p: string;
  /** Expiry, ms since epoch. */
  e: number;
}

function key(): string | null {
  const s = process.env.ERPNEXT_API_SECRET;
  return s ? `bs-lead-ref:${s}` : null;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sig = (k: string, data: string) => createHmac("sha256", k).update(data).digest("base64url");

/** Keyed hash of a phone number, so references and the in-memory dedupe never hold the number itself. */
export function phoneHash(e164: string): string {
  const k = key() ?? "bs-lead-ref";
  return createHmac("sha256", k).update(`phone:${e164}`).digest("base64url").slice(0, 22);
}

export function signLeadRef(lead: string, e164: string, now = Date.now()): string | null {
  const k = key();
  if (!k || !lead) return null;
  const data = b64(JSON.stringify({ l: lead, p: phoneHash(e164), e: now + LEAD_REF_TTL_MS } satisfies Payload));
  return `${data}.${sig(k, data)}`;
}

/** The lead and phone hash for a valid, unexpired reference; null otherwise. */
export function verifyLeadRef(ref: string, now = Date.now()): { lead: string; phone: string } | null {
  const k = key();
  if (!k || typeof ref !== "string" || ref.length > 600) return null;
  const [data, given] = ref.split(".");
  if (!data || !given) return null;
  const want = Buffer.from(sig(k, data));
  const got = Buffer.from(given);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Payload;
    if (typeof p.l !== "string" || typeof p.p !== "string" || typeof p.e !== "number" || p.e < now) return null;
    return { lead: p.l, phone: p.p };
  } catch {
    return null;
  }
}
