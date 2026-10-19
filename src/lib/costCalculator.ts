import { DATA, RATES, maxResidents, pick, usesPackage, type Answers, type JurisdictionChoice, type SetupOption, type WorkspaceKey } from "@/lib/pricing";

/*
  /cost-calculator: the visitor's choices and the page's itemised estimate, shared by the page (CcScript) and its API
  route. Same rate card and maths as lib/pricing estimate(); this adds the business activity and returns the parts
  the page draws (package, residency, workspace, bank help).
*/

/** Business activities the page offers: [id, English label]. */
export const CC_ACTIVITIES = [
  ["trading", "Trading"],
  ["services", "Consulting and services"],
  ["ecom", "E-commerce"],
  ["media", "Media and marketing"],
  ["tech", "Technology and IT"],
  ["other", "Something else"],
] as const;
export type CcActivity = (typeof CC_ACTIVITIES)[number][0];

export interface CcAnswers {
  jurisdiction?: JurisdictionChoice;
  /** An option id from DATA, or "recommend". */
  option?: string;
  residency: number;
  workspace: WorkspaceKey;
  bank: boolean;
  activity?: CcActivity;
}

export interface CcEstimate {
  opt: SetupOption;
  chosen: boolean;
  /** English key of the page's "priced on" line when no setup is chosen yet; empty once one is. */
  basis: string;
  pack: boolean;
  off: boolean;
  n: number;
  base: number;
  res: number;
  ws: number;
  bank: number;
  total: number;
  renewal: number;
  from: boolean;
}

export const toAnswers = (a: CcAnswers): Answers => ({
  jurisdiction: a.jurisdiction,
  option: a.option,
  residency: a.residency,
  workspace: a.workspace,
  bank: a.bank ? "yes" : "no",
});
export const ccUsesPackage = (a: CcAnswers) => usesPackage(toAnswers(a));
export const ccMaxResidents = (a: CcAnswers) => maxResidents(toAnswers(a));
export const activityLabel = (id: string | undefined) => CC_ACTIVITIES.find(([v]) => v === id)?.[1] ?? "";

function basisFor(a: CcAnswers, chosen: boolean): string {
  if (chosen) return "";
  if (a.jurisdiction === "mainland") return "Priced on a Dubai mainland LLC";
  if (a.jurisdiction === "offshore") return "Priced on the entry-level offshore package";
  return "Priced on the entry-level free zone package";
}

/** The itemised first-year estimate, or null until there is a jurisdiction and (unless undecided) a setup. */
export function ccEstimate(a: CcAnswers): CcEstimate | null {
  const la = toAnswers(a);
  const p = pick(la);
  if (!p) return null;
  const { opt, chosen } = p;
  const off = a.jurisdiction === "offshore";
  const pack = usesPackage(la) && !!opt.exact;
  const n = off ? 0 : Math.max(0, Math.min(maxResidents(la), a.residency | 0));
  let base = opt.price;
  let res = 0;
  let ws = 0;
  if (pack && opt.exact) {
    base = opt.exact["0"];
    res = opt.exact[String(n)] - base;
  } else {
    res = n > 0 ? RATES.establishmentCard + n * RATES.residencyPerPerson : 0;
    ws = off ? 0 : RATES.workspace[a.workspace] || 0;
  }
  const bank = a.bank ? RATES.bank : 0;
  return { opt, chosen, basis: basisFor(a, chosen), pack, off, n, base, res, ws, bank, total: Math.round(base + res + ws + bank), renewal: Math.round(RATES.renewalShare * base), from: !pack };
}

const JURISDICTIONS = ["mainland", "freezone", "offshore", "undecided"] as const;
const WORKSPACES = ["flexi", "private", "virtual", "none"] as const;

/** The answers a request may carry, checked against the rate card; anything unknown is dropped or clamped. */
export function ccAnswersFrom(v: unknown): CcAnswers | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const jurisdiction = JURISDICTIONS.find((j) => j === r.jurisdiction);
  if (!jurisdiction) return null;
  const option =
    jurisdiction === "undecided" ? undefined : DATA[jurisdiction].some((o) => o.id === r.option) ? (r.option as string) : "recommend";
  const a: CcAnswers = {
    jurisdiction,
    option,
    residency: 0,
    workspace: WORKSPACES.find((w) => w === r.workspace) ?? "none",
    bank: r.bank === true,
    activity: CC_ACTIVITIES.find(([id]) => id === r.activity)?.[0],
  };
  const n = Number(r.residency);
  if (jurisdiction === "offshore") a.workspace = "none";
  else a.residency = Number.isFinite(n) ? Math.max(0, Math.min(ccMaxResidents(a), Math.trunc(n))) : 0;
  return a;
}
