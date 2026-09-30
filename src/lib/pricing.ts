/* ============================================================
   RATE CARD: copied from best-solution.ae/pricing on 30 Sep 2026.
   Update here when the rate card changes.
   price = the published "from" price.
   exact = published year-one package totals by number of residency visas.
   ============================================================ */

export type Jurisdiction = "mainland" | "freezone" | "offshore";
export type JurisdictionChoice = Jurisdiction | "undecided";
export type WorkspaceKey = "flexi" | "private" | "virtual" | "none";
export type StepId = "profile" | "jurisdiction" | "option" | "residency" | "workspace" | "bank";

export interface SetupOption {
  id: string;
  name: string;
  price: number;
  desc: string;
  emirate?: string;
  exact?: Record<string, number>;
}

export interface Answers {
  profile?: string;
  jurisdiction?: JurisdictionChoice;
  /** An option id from DATA, or "recommend". */
  option?: string;
  residency?: number;
  workspace?: WorkspaceKey;
  bank?: "yes" | "no";
}

export interface EstimateLine {
  label: string;
  note?: string;
  amount?: number;
  text?: string;
}

export interface Estimate {
  name: string;
  basis: string;
  /** Catalogue prices are published as "from" prices. */
  from: boolean;
  lines: EstimateLine[];
  total: number;
  renewal: number;
  residents: number;
}

export const DATA: Record<Jurisdiction, SetupOption[]> = {
  mainland: [
    { id: "m0", name: "Dubai Mainland, LLC (DET)", price: 13000, desc: "", emirate: "Dubai" },
    { id: "m1", name: "Dubai Mainland, Professional / Civil", price: 9000, desc: "Sole establishment or civil company for service professionals", emirate: "Dubai" },
    { id: "m2", name: "Dubai Mainland, General Trading", price: 28000, desc: "Broad import / export and trading scope", emirate: "Dubai" },
    { id: "m3", name: "Dubai Mainland, Instant setup", price: 11500, desc: "Fast-track setup, no immediate lease", emirate: "Dubai" },
    { id: "m4", name: "Dubai Mainland, E-Trader", price: 1500, desc: "Home-based or online sole trader", emirate: "Dubai" },
    { id: "m5", name: "Abu Dhabi Mainland", price: 18000, desc: "", emirate: "Abu Dhabi" },
    { id: "m6", name: "Sharjah Mainland (SEDD)", price: 20000, desc: "", emirate: "Sharjah" },
    { id: "m7", name: "Ajman Mainland (Ajman DED)", price: 20000, desc: "", emirate: "Northern Emirates" },
    { id: "m8", name: "Ras Al Khaimah Mainland (RAK DED)", price: 18000, desc: "", emirate: "Northern Emirates" },
    { id: "m9", name: "Fujairah Mainland (Fujairah DED)", price: 22000, desc: "", emirate: "Northern Emirates" },
    { id: "m10", name: "Umm Al Quwain Mainland (UAQ DED)", price: 20000, desc: "", emirate: "Northern Emirates" },
  ],
  freezone: [
    { id: "f0", name: "IFZA (Dubai)", price: 12900, desc: "Low-cost, flexible", emirate: "Dubai", exact: { "0": 12900, "1": 17680, "2": 24210, "3": 30740, "4": 37270 } },
    { id: "f1", name: "Meydan Free Zone", price: 12520, desc: "Central Dubai address; fast e-commerce and consultancy", emirate: "Dubai", exact: { "0": 12520, "1": 22710, "2": 30880 } },
    { id: "f2", name: "DMCC", price: 35484, desc: "Premium commodities and trade hub, JLT", emirate: "Dubai" },
    { id: "f3", name: "JAFZA (Jebel Ali)", price: 45000, desc: "Trading, logistics, industrial; port access", emirate: "Dubai" },
    { id: "f4", name: "Dubai Silicon Oasis / DIEZ", price: 12000, desc: "Tech, trading and services; integrated zone", emirate: "Dubai" },
    { id: "f5", name: "Dubai Internet City", price: 20550, desc: "Technology and IT companies", emirate: "Dubai" },
    { id: "f6", name: "Dubai Media City", price: 29000, desc: "Media, marketing and creative businesses", emirate: "Dubai" },
    { id: "f7", name: "Dubai Airport Free Zone (DAFZA)", price: 25000, desc: "Aviation, logistics, high-value trade", emirate: "Dubai" },
    { id: "f8", name: "Dubai South (DWC)", price: 12540, desc: "Logistics, aviation and e-commerce", emirate: "Dubai", exact: { "0": 12540, "1": 23690, "2": 32840 } },
    { id: "f9", name: "Dubai Healthcare City", price: 25000, desc: "Clinical and allied health", emirate: "Dubai" },
    { id: "f10", name: "DIFC", price: 50000, desc: "Financial services and holding (common-law)", emirate: "Dubai" },
    { id: "f11", name: "Dubai CommerCity", price: 28000, desc: "Dedicated e-commerce free zone", emirate: "Dubai" },
    { id: "f12", name: "ADGM", price: 39300, desc: "International financial centre (common-law)", emirate: "Abu Dhabi" },
    { id: "f13", name: "KEZAD", price: 9450, desc: "Industrial, logistics and trading", emirate: "Abu Dhabi" },
    { id: "f14", name: "Masdar City Free Zone", price: 7010, desc: "Clean tech, renewable energy and innovation", emirate: "Abu Dhabi" },
    { id: "f15", name: "SHAMS (Sharjah Media City)", price: 6885, desc: "Low-cost media, creative and services packages", emirate: "Sharjah", exact: { "0": 6885, "1": 15645, "2": 21485, "3": 27325 } },
    { id: "f16", name: "SAIF Zone", price: 12000, desc: "Airport-linked trading, logistics and light industry", emirate: "Sharjah" },
    { id: "f17", name: "Hamriyah Free Zone (HFZA)", price: 11000, desc: "Industrial, manufacturing and trading; port access", emirate: "Sharjah" },
    { id: "f18", name: "SPC Free Zone", price: 6885, desc: "Publishing, media and 1,500+ activities, fast setup", emirate: "Sharjah", exact: { "0": 6885, "1": 15030, "2": 20245, "3": 25460, "4": 30675 } },
    { id: "f19", name: "SRTIP", price: 5510, desc: "Research, technology and innovation", emirate: "Sharjah", exact: { "0": 5510, "1": 15120, "2": 19575 } },
    { id: "f20", name: "Ajman Free Zone (AFZ)", price: 5555, desc: "Low-cost trading, services and industrial", emirate: "Northern Emirates" },
    { id: "f21", name: "Ajman Nu Venture Free Zone", price: 4888, desc: "Budget media and services packages", emirate: "Northern Emirates", exact: { "0": 4898, "1": 11460, "2": 17510, "3": 22660, "4": 27810 } },
    { id: "f22", name: "RAKEZ", price: 6010, desc: "One of the most cost-effective; trading, services, industrial", emirate: "Northern Emirates", exact: { "0": 9110, "1": 14482.5, "2": 18955, "3": 23427.5, "4": 27900 } },
    { id: "f23", name: "RAK Maritime City", price: 18000, desc: "Maritime, industrial and trading", emirate: "Northern Emirates" },
    { id: "f24", name: "Innovation City", price: 6600, desc: "Digital assets and Web3 companies", emirate: "Northern Emirates" },
    { id: "f25", name: "Fujairah Free Zone (FFZ)", price: 21500, desc: "Trading, logistics and industry; East-coast port", emirate: "Northern Emirates" },
    { id: "f26", name: "Creative City Fujairah", price: 5530, desc: "Media, consultancy and services", emirate: "Northern Emirates" },
    { id: "f27", name: "Umm Al Quwain (UAQ FTZ)", price: 5500, desc: "Low-cost trading, services and micro-business", emirate: "Northern Emirates" },
  ],
  offshore: [
    { id: "o0", name: "RAK ICC Offshore", price: 10000, desc: "International holding / trading; no UAE office or residency" },
    { id: "o1", name: "JAFZA Offshore", price: 20000, desc: "Dubai offshore; can own Dubai property (subject to rules)" },
    { id: "o2", name: "Ajman Offshore", price: 9000, desc: "Lower-cost offshore" },
  ],
};

/* Add-on rates, as used by the quote builder on best-solution.ae/pricing */
export const RATES = {
  residencyPerPerson: 5500, // per person, 2 years
  establishmentCard: 2500, // once, when at least one person needs residency
  workspace: { flexi: 8000, private: 15000, virtual: 5000, none: 0 } as Record<WorkspaceKey, number>,
  bank: 3000,
  renewalShare: 0.9, // year-two renewal as a share of the base setup price
};

/** Upper bound on residency when no package table applies. */
const DEFAULT_MAX_RESIDENTS = 6;

export function cheapest(list: SetupOption[]): SetupOption {
  return list.reduce((m, o) => (o.price < m.price ? o : m));
}

interface Pick {
  opt: SetupOption;
  chosen: boolean;
  basis?: string;
}

/* The setup the estimate is based on. It always follows the visitor's own choices. */
export function pick(a: Answers): Pick | null {
  const j = a.jurisdiction;
  if (!j) return null;
  if (j === "undecided") {
    return { opt: cheapest(DATA.freezone), chosen: false, basis: "Based on the lowest-cost free zone on our rate card" };
  }
  if (a.option === undefined) return null;
  if (a.option === "recommend") {
    if (j === "mainland") return { opt: DATA.mainland[0], chosen: false, basis: "Based on a Dubai mainland LLC" };
    return {
      opt: cheapest(DATA[j]),
      chosen: false,
      basis: "Based on the lowest-cost " + (j === "freezone" ? "free zone" : "offshore jurisdiction") + " on our rate card",
    };
  }
  const opt = DATA[j].find((o) => o.id === a.option);
  return opt ? { opt, chosen: true } : null;
}

export function usesPackage(a: Answers): boolean {
  const p = pick(a);
  return !!(p && p.chosen && p.opt.exact);
}

export function maxResidents(a: Answers): number {
  const p = pick(a);
  if (!p || !usesPackage(a) || !p.opt.exact) return DEFAULT_MAX_RESIDENTS;
  return Math.max(...Object.keys(p.opt.exact).map(Number));
}

/* Which questions apply to this visitor. */
export function stepOrder(a: Answers): StepId[] {
  const j = a.jurisdiction;
  const order: StepId[] = ["profile", "jurisdiction"];
  if (j !== "undecided") order.push("option");
  if (j !== "offshore") {
    order.push("residency");
    if (!usesPackage(a)) order.push("workspace");
  }
  order.push("bank");
  return order;
}

/* Pure estimate function: answers in, itemised first-year figure out. */
export function estimate(a: Answers): Estimate {
  const p = pick(a);
  if (!p) throw new Error("estimate() needs a jurisdiction and, unless undecided, a setup option");
  const opt = p.opt;
  const off = a.jurisdiction === "offshore";
  const pack = usesPackage(a);
  const n = off ? 0 : Math.max(0, Math.min(maxResidents(a), (a.residency ?? 0) | 0));
  const lines: EstimateLine[] = [];
  let base: number;
  let residency = 0;
  let workspace = 0;

  if (pack && opt.exact) {
    base = opt.exact["0"];
    residency = opt.exact[String(n)] - base;
  } else {
    base = opt.price;
    residency = n > 0 ? RATES.establishmentCard + n * RATES.residencyPerPerson : 0;
    workspace = off ? 0 : RATES.workspace[a.workspace ?? "none"] || 0;
  }

  lines.push({ label: "Company formation and authority fees", amount: base });

  if (off) lines.push({ label: "Residency", text: "Not applicable" });
  else if (n)
    lines.push({
      label: "Residency for " + n + (n === 1 ? " person" : " people"),
      note: pack ? "" : "Two-year residency, including the establishment card",
      amount: residency,
    });
  else lines.push({ label: "Residency", text: "None selected" });

  if (off) lines.push({ label: "Workspace", text: "Not required" });
  else if (pack) lines.push({ label: "Workspace", text: "Included" });
  else lines.push(workspace ? { label: "Workspace", amount: workspace } : { label: "Workspace", text: "None selected" });

  if (a.bank === "yes") lines.push({ label: "Bank account assistance", amount: RATES.bank });

  const total = base + residency + workspace + (a.bank === "yes" ? RATES.bank : 0);

  return {
    name: p.chosen ? opt.name : "To be recommended by your consultant",
    basis: p.basis || "",
    from: !pack,
    lines,
    total: Math.round(total),
    renewal: Math.round(RATES.renewalShare * base),
    residents: n,
  };
}

export function formatAED(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
