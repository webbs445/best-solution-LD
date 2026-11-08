import { ZONES } from "@/content/freezone";

/*
  The home setup planner, browser-safe: questions, options and step order with no prices (Google Ads policy, and so no
  rate card reaches the browser). Option ids match lib/pricing DATA, so /api/lead can still describe the choice for the
  ERP on the server. Names avoid government department names; free zones come from content/freezone.
*/

export type Jurisdiction = "mainland" | "freezone" | "offshore";
export type JurisdictionChoice = Jurisdiction | "undecided";
export type WorkspaceKey = "flexi" | "private" | "virtual" | "none";
export type PlanStep = "jurisdiction" | "option" | "team" | "workspace";

export interface PlanOption {
  id: string;
  name: string;
  desc: string;
  emirate?: string;
}

export interface PlanAnswers {
  jurisdiction?: JurisdictionChoice;
  /** An option id (lib/pricing DATA ids), or "recommend". */
  option?: string;
  /** People who will work in the business. */
  team?: number;
  workspace?: WorkspaceKey;
}

export const MAX_TEAM = 20;

export const PLAN_OPTIONS: Record<Jurisdiction, PlanOption[]> = {
  mainland: [
    { id: "m0", name: "Dubai mainland company", desc: "A limited liability company trading across the UAE", emirate: "Dubai" },
    { id: "m1", name: "Dubai mainland, professional or civil company", desc: "For service professionals and consultants", emirate: "Dubai" },
    { id: "m2", name: "Dubai mainland, general trading", desc: "Broad import, export and trading scope", emirate: "Dubai" },
    { id: "m3", name: "Dubai mainland, flexible office option", desc: "When you do not need an office lease straight away", emirate: "Dubai" },
    { id: "m4", name: "Dubai mainland, home-based or online trader", desc: "For a sole trader working from home or online", emirate: "Dubai" },
    { id: "m5", name: "Abu Dhabi mainland", desc: "", emirate: "Abu Dhabi" },
    { id: "m6", name: "Sharjah mainland", desc: "", emirate: "Sharjah" },
    { id: "m7", name: "Ajman mainland", desc: "", emirate: "Northern Emirates" },
    { id: "m8", name: "Ras Al Khaimah mainland", desc: "", emirate: "Northern Emirates" },
    { id: "m9", name: "Fujairah mainland", desc: "", emirate: "Northern Emirates" },
    { id: "m10", name: "Umm Al Quwain mainland", desc: "", emirate: "Northern Emirates" },
  ],
  freezone: ZONES.map((z) => ({ id: z.id, name: z.name, desc: z.d, emirate: z.emirate })),
  offshore: [
    { id: "o0", name: "Ras Al Khaimah offshore", desc: "International holding and trading, with no UAE office" },
    { id: "o1", name: "Jebel Ali offshore", desc: "Dubai offshore, often used to hold property" },
    { id: "o2", name: "Ajman offshore", desc: "International holding structures" },
  ],
};

/** [value, title, description?] */
export type PlanChoice = [value: string, title: string, desc?: string];

export const PLAN_STEPS: Record<PlanStep, { q: string; hint?: string; options?: PlanChoice[] }> = {
  jurisdiction: {
    q: "Which jurisdiction are you considering?",
    options: [
      ["mainland", "Mainland", "Trade directly across the UAE"],
      ["freezone", "Free zone", "International and business-to-business operations"],
      ["offshore", "Offshore", "Holding structures and asset protection"],
      ["undecided", "Not sure yet", "Your advisor talks the options through with you"],
    ],
  },
  option: { q: "" },
  team: {
    q: "How many people will work in the business?",
    hint: "Include yourself, partners and employees.",
  },
  workspace: {
    q: "What type of workspace do you need?",
    options: [
      ["flexi", "Flexi-desk or shared desk"],
      ["private", "Private office"],
      ["virtual", "Virtual office"],
      ["none", "No workspace needed"],
    ],
  },
};

export const OPTION_Q: Record<Jurisdiction, string> = {
  mainland: "Which mainland structure fits your business?",
  freezone: "Which free zone are you considering?",
  offshore: "Which offshore jurisdiction are you considering?",
};

/** The questions that apply to this visitor (2 to 4). */
export function planOrder(a: PlanAnswers): PlanStep[] {
  const j = a.jurisdiction;
  const order: PlanStep[] = ["jurisdiction"];
  if (j !== "undecided") order.push("option");
  if (j !== "offshore") order.push("team", "workspace");
  return order;
}

/** The option the visitor picked, or null for "recommend one for me" / not answered yet. */
export function chosenOption(a: PlanAnswers): PlanOption | null {
  const j = a.jurisdiction;
  if (!j || j === "undecided" || !a.option || a.option === "recommend") return null;
  return PLAN_OPTIONS[j].find((o) => o.id === a.option) ?? null;
}

export const jurisdictionName = (j?: JurisdictionChoice) =>
  PLAN_STEPS.jurisdiction.options?.find((o) => o[0] === j)?.[1] ?? "Not sure yet";

/** An answered step in words, for the answer tags and the result's "change" buttons. */
export function planAnswerLabel(id: PlanStep, a: PlanAnswers): string {
  if (id === "team") {
    const n = a.team ?? 1;
    return n >= MAX_TEAM ? `${MAX_TEAM} or more people` : n === 1 ? "Just me" : `${n} people`;
  }
  if (id === "option") return chosenOption(a)?.name ?? "Recommend one for me";
  return PLAN_STEPS[id].options?.find((o) => o[0] === a[id])?.[1] ?? "";
}

/** The choices in the shape /api/lead reads for home leads (lib/pricing Answers). No residency is asked. */
export const leadAnswers = (a: PlanAnswers) => ({
  jurisdiction: a.jurisdiction,
  option: a.option,
  residency: 0,
  workspace: a.workspace,
  bank: "no" as const,
});
