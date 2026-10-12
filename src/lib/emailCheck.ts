import { resolve4, resolveMx } from "node:dns/promises";
import { LEAD_RULES } from "@/lib/lead";

/*
  Server-only: does the email's domain receive mail at all? Catches made-up domains (name@asdfgh.com) that pass
  the format check. A DNS problem or a slow answer counts as fine, so a real lead is never lost to it.
*/

const cache = new Map<string, boolean>();
const TIMEOUT_MS = 2500;

const code = (e: unknown) => (e as NodeJS.ErrnoException)?.code;
const missing = (e: unknown) => code(e) === "ENOTFOUND" || code(e) === "ENODATA";

async function lookup(domain: string): Promise<boolean> {
  try {
    const mx = await resolveMx(domain);
    // A "null MX" (one record pointing at ".") means the domain takes no mail.
    if (mx.length) return mx.some((r) => r.exchange && r.exchange !== ".");
  } catch (e) {
    if (code(e) === "ENOTFOUND") return false;
    if (!missing(e)) return true;
  }
  // No MX record: mail falls back to the domain's own address, if it has one.
  try {
    return (await resolve4(domain)).length > 0;
  } catch (e) {
    return !missing(e);
  }
}

export async function emailDomainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  const known = cache.get(domain);
  if (known !== undefined) return known;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ok = await Promise.race([
    lookup(domain).catch(() => true),
    new Promise<boolean>((r) => (timer = setTimeout(() => r(true), TIMEOUT_MS))),
  ]);
  clearTimeout(timer);
  if (cache.size > 1000) cache.clear();
  cache.set(domain, ok);
  return ok;
}

/** The full email check for a lead route: format, not throwaway or made up, and a domain that takes mail. */
export async function emailIsReal(email: string): Promise<boolean> {
  return LEAD_RULES.email_id(email) && (await emailDomainAcceptsMail(email));
}
