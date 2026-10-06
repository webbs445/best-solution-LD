import {
  ACT_LABEL,
  ACTS,
  DEFAULT_MAX_RESIDENTS,
  PK,
  RATES,
  SECT,
  ZONES,
  ZONE_BY_ID,
  type ActKey,
  type Activity,
  type Priority,
  type Zone,
} from "@/content/freezone";
import type { Estimate, EstimateLine } from "@/lib/pricing";

/* Free zone planner maths: pure functions shared by the /freezone page and /api/lead. */

export const MAX_RESIDENCY_INPUT = 12;
export const MAX_SHAREHOLDERS = 12;
export const MAX_ACTIVITIES = 10;

export interface PlannerInput {
  zone: string;
  acts: ActKey[];
  pri: Priority;
  /** People needing residency. */
  res: number;
  /** Shareholders. */
  sh: number;
  /** Activities on the licence. */
  na: number;
  bank: boolean;
}

/** Largest team a zone's published packages cover, or null when priced per person. */
export function maxPack(z: Zone): number | null {
  return z.exact ? Math.max(...Object.keys(z.exact).map(Number)) : null;
}

export function maxResidents(z: Zone): number {
  return maxPack(z) ?? DEFAULT_MAX_RESIDENTS;
}

export function renewalFor(z: Zone): number {
  return RATES.renewalShare * (z.exact ? z.exact["0"] : z.price);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

/* A limit can differ between packages without residency (0) and with residency (v). */
function lim(v: number | { 0: number; v: number } | undefined, res: number): number | null {
  if (v == null) return null;
  return typeof v === "object" ? (res === 0 ? v[0] : v.v) : v;
}

/** Package limits and extra fees from the rate card: priced extras, or warnings when the advisor quotes. */
export function extras(zoneId: string, res: number, sh: number, na: number) {
  const pk = PK[zoneId];
  const out = { lines: [] as EstimateLine[], add: 0, warn: [] as string[] };
  if (!pk) return out;
  const sl = lim(pk.sh, res);
  const al = lim(pk.act, res);
  if (sl != null && sh > sl) {
    const ds = sh - sl;
    if (pk.shFee) {
      out.lines.push({ label: `${ds} extra shareholder${ds > 1 ? "s" : ""}`, amount: ds * pk.shFee });
      out.add += ds * pk.shFee;
    } else out.warn.push(`Package allows up to ${sl} shareholders`);
  }
  if (al != null && na > al) {
    const da = na - al;
    if (pk.actFee) {
      out.lines.push({ label: `${da} extra activit${da > 1 ? "ies" : "y"}`, amount: da * pk.actFee });
      out.add += da * pk.actFee;
    } else out.warn.push(`Package includes up to ${al} activities`);
  }
  return out;
}

/* One zone's first-year figure. Published packages price residency per team size; otherwise per person. */
function zoneEstimate(z: Zone, residency: number, bank: boolean): Estimate {
  const pack = !!z.exact;
  const n = clamp(residency, 0, maxResidents(z));
  let base: number;
  let res = 0;
  if (z.exact) {
    base = z.exact["0"];
    res = z.exact[String(n)] - base;
  } else {
    base = z.price;
    res = n > 0 ? RATES.establishmentCard + n * RATES.residencyPerPerson : 0;
  }
  const lines: EstimateLine[] = [{ label: "Free zone package", amount: base }];
  lines.push(
    n
      ? {
          label: `Residency for ${n}${n === 1 ? " person" : " people"}`,
          note: pack ? "" : "Two-year residency costs",
          amount: res,
        }
      : { label: "Residency", text: "None selected" },
  );
  lines.push({ label: "Flexi-desk workspace", text: "Included" });
  if (bank) lines.push({ label: "Bank account assistance", amount: RATES.bank });
  return {
    name: z.name,
    basis: "",
    from: !pack,
    lines,
    total: Math.round(base + res + (bank ? RATES.bank : 0)),
    renewal: Math.round(RATES.renewalShare * base),
    residents: n,
  };
}

/** Normalise untrusted planner input (from the browser or the API) into valid values. */
export function cleanPlanner(p: Partial<PlannerInput>): PlannerInput {
  const zone = typeof p.zone === "string" && ZONE_BY_ID[p.zone] ? p.zone : ZONES[0].id;
  const acts = Array.isArray(p.acts) ? p.acts.filter((a): a is ActKey => typeof a === "string" && a in ACT_LABEL).slice(0, 3) : [];
  const pri: Priority = p.pri === "dubai" || p.pri === "sector" ? p.pri : "cost";
  return {
    zone,
    acts,
    pri,
    res: clamp(p.res ?? 0, 0, maxResidents(ZONE_BY_ID[zone])),
    sh: clamp(p.sh ?? 1, 1, MAX_SHAREHOLDERS),
    na: clamp(p.na ?? 1, 1, MAX_ACTIVITIES),
    bank: p.bank === true,
  };
}

/** The planner's itemised first-year estimate for the selected zone. */
export function plannerEstimate(input: PlannerInput): Estimate {
  const z = ZONE_BY_ID[input.zone];
  const res = Math.min(input.res, maxResidents(z));
  const est = zoneEstimate(z, res, input.bank);
  const ex = extras(z.id, res, input.sh, input.na);
  return {
    ...est,
    lines: [...est.lines, ...ex.lines, ...ex.warn.map((w) => ({ label: w, text: "Advisor quotes" }))],
    total: est.total + ex.add,
  };
}

/* Ranking: the zone's typical first-year total for the visitor's team, without workspace or bank extras. */
function totalFor(z: Zone, p: PlannerInput) {
  const r = Math.min(p.res, maxResidents(z));
  const ex = extras(z.id, r, p.sh, p.na);
  return { total: zoneEstimate(z, r, false).total + ex.add, ok: !ex.warn.length };
}

function score(z: Zone, p: PlannerInput): number {
  let s = 0;
  if (p.acts.length) p.acts.forEach((a) => (s += z.t.includes(a) ? 6 : -2));
  else s += 2;
  if (p.pri === "dubai") s += z.g.includes("dubai") ? 5 : -3;
  if (p.pri === "sector") s += z.g.includes("sector") || z.g.includes("finance") || z.g.includes("trade") ? 4 : 0;
  const tf = totalFor(z, p);
  const t = tf.total;
  if (p.pri === "cost") s += t < 8000 ? 6 : t < 14000 ? 4 : t < 22000 ? 2 : t < 32000 ? 0 : -2;
  const mp = maxPack(z);
  if (mp !== null && p.res > mp) s -= 4;
  if (!tf.ok) s -= 4;
  if (PK[z.id]) s += 1;
  return s;
}

export interface Match {
  zone: Zone;
  /** Match percentage shown on the card. */
  pct: number;
  total: number;
}

/** The top four zones for the visitor's choices, best first. */
export function topMatches(p: PlannerInput): Match[] {
  const max = (p.acts.length ? p.acts.length * 6 : 2) + 5;
  return ZONES.map((zone) => ({ zone, s: score(zone, p) }))
    .sort((a, b) => b.s - a.s || a.zone.price - b.zone.price)
    .slice(0, 4)
    .map((r, i) => {
      let pct = Math.max(35, Math.min(98, Math.round((100 * (r.s + 4)) / (max + 4))));
      if (i === 0 && p.acts.length) pct = Math.max(pct, 88);
      return { zone: r.zone, pct, total: totalFor(r.zone, p).total };
    });
}

/* ---------- Activity search ---------- */

export function norm(t: string): string {
  return t
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(w: string): string {
  return w.length > 4 ? w.replace(/(ies)$/, "y").replace(/(ing|ers|er|es|s)$/, "") : w;
}

const AIDX = ACTS.map((a) => ({ a, n: norm(a[0]), k: norm(`${a[0]} ${a[2]} ${SECT[a[1]] || ""}`) }));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Activities matching a free-text query, best first. */
export function findActs(query: string): Activity[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const toks = q
    .split(" ")
    .map(stem)
    .filter((t) => t.length > 1);
  const ws = new RegExp(`(^| )${escapeRe(q)}`);
  return AIDX.map((x) => {
    let sc = 0;
    if (x.n.indexOf(q) === 0) sc += 100;
    else if (ws.test(x.n)) sc += 80;
    else if (ws.test(x.k)) sc += 50;
    else if (q.length >= 3 && x.n.includes(q)) sc += 40;
    else if (q.length >= 3 && x.k.includes(q)) sc += 25;
    if (q.length < 3 && !sc) return { a: x.a, s: 0 };
    let all = true;
    toks.forEach((t) => {
      if (x.n.includes(t)) sc += 20;
      else if (x.k.includes(t)) sc += 10;
      else all = false;
    });
    if (!all) sc = Math.round(sc * 0.4);
    return { a: x.a, s: sc };
  })
    .filter((r) => r.s >= 10)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.a);
}

export function zonesForSector(sector: string): number {
  return ZONES.filter((zn) => (zn.sect as string[]).includes(sector)).length;
}

/** Text a zone is found by in the explorer search. */
export function zoneHaystack(z: Zone): string {
  return `${z.name} ${z.short.join(" ")} ${z.emirate} ${z.d} ${z.t.map((t) => ACT_LABEL[t]).join(" ")}`.toLowerCase();
}

/** Cheapest and dearest starting prices, for the price meter. */
export const PRICE_MIN = Math.min(...ZONES.map((zn) => zn.price));
export const PRICE_MAX = Math.max(...ZONES.map((zn) => zn.price));
