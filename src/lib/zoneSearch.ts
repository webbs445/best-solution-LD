import { ACTS, ACT_LABEL, SECT, ZONES, type ActKey, type Activity, type Priority, type Zone } from "@/content/freezone";

/*
  Free zone search and matching for the /freezone page, safe for the browser: it reads content/freezone only (names,
  emirates and activity groups), never the server-side rate card (lib/freezoneRates). No prices, no costs.
*/

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

export interface Match {
  zone: Zone;
  /** The zone typically covers every chosen activity. */
  fits: boolean;
}

function score(z: Zone, acts: ActKey[], pri: Priority): number {
  let s = 0;
  if (acts.length) acts.forEach((a) => (s += z.t.includes(a) ? 6 : z.sect.includes(a) ? 2 : -3));
  else s += 2;
  if (pri === "dubai") s += z.emirate === "Dubai" ? 5 : -3;
  if (pri === "sector") s += z.g.includes("sector") || z.g.includes("finance") || z.g.includes("trade") ? 4 : 0;
  if (pri === "range") s += z.sect.length / 3;
  return s;
}

/** The four best-matching zones for the chosen activities and priority: full fits first. */
export function topMatches(acts: ActKey[], pri: Priority): Match[] {
  return ZONES.map((zone) => ({ zone, s: score(zone, acts, pri) }))
    .sort((a, b) => b.s - a.s || a.zone.name.localeCompare(b.zone.name))
    .slice(0, 4)
    .map(({ zone }) => ({ zone, fits: acts.every((a) => zone.sect.includes(a)) }))
    .sort((a, b) => Number(b.fits) - Number(a.fits));
}
