"use client";

import { useEffect } from "react";
import { CC_FAQ, CC_NAMES, CC_TR } from "@/content/costCalculator";
import { CC_CALCULATOR_ID, CC_PRICE_FORM_ID, CC_QUOTE_FORM_ID, LEAD_RULES } from "@/lib/lead";
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, toE164Phone, type PhoneCountry } from "@/lib/phone";
import { attributionFields } from "@/lib/attribution";
import { DATA, RATES, cheapest, type Jurisdiction, type SetupOption, type WorkspaceKey } from "@/lib/pricing";
import { activityLabel, ccEstimate, ccMaxResidents, ccUsesPackage, type CcActivity, type CcAnswers, type CcEstimate } from "@/lib/costCalculator";
import { genEventId, jurisdictionLabel, pushEvent, pushFormSubmit, pushGenerateLead, trackCalculatorComplete, trackCalculatorResultView, trackCalculatorStart, trackCalculatorStep } from "@/lib/analytics";

/*
  The /cost-calculator page's behaviour, ported from the design file's script: the six-step configurator and its
  licence card, the price lock (prices open after the details pop-up), the comparison table, the budget finder, the
  hero preview, five languages (Arabic right to left), the call pop-up and the lead forms. It works on the static
  markup (components/costCalculator/markup). Contact clicks, form_start / form_error / form_abandon and CTA clicks are
  tracked site-wide (AnalyticsInit); this adds the calculator events, and the lead conversions only after
  /api/cost-calculator has saved the lead in the ERP. Everything it starts stops when the page unmounts.
*/

type Lang = "en" | "ar" | "fr" | "ru" | "zh";
const LANGS: [Lang, string, string][] = [["en", "English", "EN"], ["ar", "العربية", "AR"], ["fr", "Français", "FR"], ["ru", "Русский", "RU"], ["zh", "中文", "中文"]];
const IX: Record<Exclude<Lang, "en">, number> = { ar: 0, fr: 1, ru: 2, zh: 3 };
const FONTS: Partial<Record<Lang, string>> = { ar: "Noto+Sans+Arabic:wght@400;500;600;700", zh: "Noto+Sans+SC:wght@400;500;600;700" };
type Choice = Jurisdiction | "undecided";
const JL: Record<Choice, string> = { mainland: "Mainland", freezone: "Free zone", offshore: "Offshore", undecided: "Not sure yet" };
const JUR: [Choice, string][] = [["mainland", "Trade directly across the UAE market"], ["freezone", "International and business-to-business work"], ["offshore", "Holding structures and asset protection"], ["undecided", "We'll suggest the right one"]];
const WS: [WorkspaceKey, string, string][] = [["flexi", "Flexi-desk", "A shared desk in a business centre"], ["private", "Private office", "Your own lockable office"], ["virtual", "Virtual office", "A business address and mail"], ["none", "No workspace", "I have one, or don't need it"]];
const WSN: Record<WorkspaceKey, string> = { flexi: "Flexi-desk", private: "Private office", virtual: "Virtual", none: "None" };
const ACT_UI: Record<CcActivity, [string, string]> = {
  trading: ["Import, export and general trading", '<path d="M3 7h13l-3-3M21 17H8l3 3"/>'],
  services: ["Consultancy, management and professional services", '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'],
  ecom: ["Selling products online", '<path d="M3 4h2l2.5 11h11L21 7H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'],
  media: ["Advertising, content and creative work", '<path d="M3 10v4h4l6 5V5L7 10z"/><path d="M17 8a5 5 0 0 1 0 8"/>'],
  tech: ["Software, apps and IT services", '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'],
  other: ["Your advisor will check it for you", '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01"/>'],
};
const STEPS: [string, string][] = [["where", "Where"], ["act", "Activity"], ["setup", "Setup"], ["visas", "Visas"], ["space", "Workspace"], ["extras", "Extras"]];

/* authority logos in /zones; a drawn emirate badge stands in where there is no logo */
const LOGO: Record<string, string> = {
  f0: "ifza.webp", f1: "meydan.webp", f2: "dmcc.webp", f3: "jafza.svg", f4: "dubai-silicon-oasis.svg", f5: "dubai-internet-city.webp", f6: "dubai-media-city.webp", f7: "dafza.webp", f8: "dubai-south.svg", f9: "dubai-healthcare-city.svg", f10: "difc.webp", f11: "dubai-commercity.svg", f12: "adgm.svg", f13: "kezad.webp", f14: "masdar-city.webp", f15: "shams.webp", f16: "saif-zone.webp", f17: "hamriyah.webp", f18: "spc.webp", f19: "srtip.webp", f20: "ajman-free-zone.webp", f21: "ajman-nu-venture.webp", f22: "rakez.webp", f24: "innovation-city.svg", f25: "fujairah-free-zone.webp", f26: "creative-city-fujairah.webp", f27: "uaq-ftz.webp", o1: "jafza.svg",
  m0: "det.webp", m1: "det.webp", m2: "det.webp", m3: "det.webp", m4: "det.webp", m5: "added.webp", m6: "sedd.webp", m7: "ajman-government.webp", m8: "rak-government.webp", m9: "fujairah-government.webp", o0: "rak-icc.webp", o2: "ajman-free-zone.webp",
};
const MONO: Record<string, [string, string]> = { m10: ["UAQ", "DED"], f23: ["RAK", "MARITIME"] };
/* the real emirate, where the setup filter groups them as "Northern Emirates" */
const CITY: Record<string, string> = { m7: "Ajman", m8: "Ras Al Khaimah", m9: "Fujairah", m10: "Umm Al Quwain", f20: "Ajman", f21: "Ajman", f22: "Ras Al Khaimah", f23: "Ras Al Khaimah", f24: "Ras Al Khaimah", f25: "Fujairah", f26: "Fujairah", f27: "Umm Al Quwain", o0: "Ras Al Khaimah", o1: "Dubai", o2: "Ajman" };
const LM: Record<string, string> = {
  uaq: '<path d="M24 45V21M24 21c-6-6-14-4-16 1M24 21c6-6 14-4 16 1M24 21c-2-8-10-10-14-7M24 21c2-8 10-10 14-7M10 45h28M4 45c3-1.5 5-1.5 8 0"/>',
  rak: '<path d="M3 42l12-18 7 9 9-15 14 24zM27 24l4-6 5 7M3 45h42"/>',
};
const EMK: Record<string, string> = { "Ras Al Khaimah": "rak", "Umm Al Quwain": "uaq" };
const CMP_ROWS: [string, string | number, string | number, string | number][] = [
  ["Market access", "Anywhere in the UAE, including the local market", "Inside the zone and internationally", "Outside the UAE only"],
  ["Workspace", "Office or flexi-desk with a tenancy contract (Ejari)", "Flexi-desk or office in the zone", "Address through a registered agent"],
  ["Residency", 1, 1, 0],
  ["Typical activities", "Retail, contracting, local services", "Consultancies, e-commerce, international trade", "Holding companies, asset ownership"],
];
const CMP_SUB: Record<Jurisdiction, string> = { mainland: "Trade directly with customers anywhere in the UAE", freezone: "International and business-to-business work", offshore: "Holding structures and asset protection" };
/* hero preview: sample setups with masked figures (the digits are placeholders, not prices) */
const MOCK: [Jurisdiction, string, [string, string, string][]][] = [
  ["mainland", "m0", [["pkg", "Company package", "14,200"], ["res", "RES2", "11,600"], ["ws", "Flexi-desk", "8,400"], ["bank", "Bank account help", "3,100"]]],
  ["freezone", "f0", [["pkg", "Package price", "13,650"], ["res", "Residency for 1 person", "5,350"], ["ws", "Workspace", ""]]],
  ["offshore", "o0", [["pkg", "Company package", "10,400"], ["res", "Residency", ""], ["bank", "Bank account help", "3,100"]]],
];

const IC: Record<string, string> = {
  mainland: '<path d="M3 21h18M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/>',
  freezone: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 9h18M9 21V9"/>',
  offshore: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  undecided: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  flexi: '<rect x="3" y="11" width="18" height="4" rx="1"/><path d="M6 15v5M18 15v5M8 11V7h8v4"/>',
  private: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M15 12h.01"/>',
  virtual: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  none: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
};
const svg = (k: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const ARW = '<svg class="arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:17px;height:17px"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const YES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/></svg>';
const NO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
const PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
const SLOT = '<span class="slot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 11h.01M15 11h.01"/></svg></span>';
/* 36 rotated ellipses and rings: a fine guilloche rosette */
const GUILLOCHE = (() => {
  let g = "";
  for (let i = 0; i < 36; i++) g += `<ellipse cx="200" cy="200" rx="192" ry="${58 + (i % 3) * 16}" transform="rotate(${i * 5} 200 200)"/>`;
  for (let r = 24; r < 200; r += 20) g += `<circle cx="200" cy="200" r="${r}"/>`;
  return `<svg viewBox="0 0 400 400" fill="none" stroke="currentColor" stroke-width=".6">${g}</svg>`;
})();
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const store = (k: string, v?: string) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { /* storage blocked */ } return null; };
const sess = (k: string, v?: string) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch { /* storage blocked */ } return null; };

export function CcScript() {
  useEffect(() => {
    const root = document.getElementById("ccPage");
    if (!root) return;
    const ac = new AbortController();
    const observers: IntersectionObserver[] = [];
    const timers: number[] = [];
    init(root, ac.signal, observers, timers);
    return () => {
      ac.abort();
      observers.forEach((o) => o.disconnect());
      timers.forEach((id) => clearInterval(id));
    };
  }, []);
  return null;
}

function init(root: HTMLElement, signal: AbortSignal, observers: IntersectionObserver[], timers: number[]) {
  const $ = <T extends HTMLElement = HTMLElement>(s: string, c: ParentNode = root) => c.querySelector<T>(s) as T;
  const $$ = <T extends HTMLElement = HTMLElement>(s: string, c: ParentNode = root) => Array.from(c.querySelectorAll<T>(s));
  const on = <E extends Event>(t: EventTarget, type: string, fn: (e: E) => void, passive = false) => t.addEventListener(type, fn as EventListener, { signal, passive });
  const observe = (cb: IntersectionObserverCallback, opts: IntersectionObserverInit, el: Element) => { const o = new IntersectionObserver(cb, opts); observers.push(o); o.observe(el); return o; };
  const closest = <T extends HTMLElement = HTMLElement>(e: Event, s: string) => (e.target as Element | null)?.closest<T>(s) ?? null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const smooth: ScrollBehavior = reduced ? "auto" : "smooth";

  /* ---------- language ---------- */
  let lang: Lang = "en";
  const t = (s: string, vars?: Record<string, string | number>) => {
    let out: string | null = lang === "en" || !CC_TR[s] ? s : CC_TR[s][IX[lang]];
    // The capitalised keys stand for long passages: their English lives in the markup.
    if (out === "NOTE" || out === "PRIV" || out === "LEGAL" || /^[A-Z_]+$/.test(out) && out === s) {
      const el = root.querySelector<HTMLElement>(`[data-t="${s}"]`);
      out = el ? el.dataset.en || el.textContent || s : s;
    }
    if (vars) for (const k in vars) out = out.split(`{${k}}`).join(String(vars[k]));
    return out;
  };
  const people = (n: number) => (n === 1 ? t("1 person") : t("{n} people", { n }));
  const nm = (o: SetupOption) => (lang !== "en" && CC_NAMES[o.id]?.[IX[lang]]) || o.name;
  const city = (o: SetupOption) => CITY[o.id] || o.emirate || "";
  const shortNm = (o: SetupOption) => { const parts = nm(o).split(/, |، |，/); return A.jurisdiction === "mainland" && parts.length > 1 ? parts.slice(1).join(", ") : nm(o); };
  const actName = () => activityLabel(A.activity);
  const logo = (o: SetupOption) => {
    if (LOGO[o.id]) return `<img src="/zones/${LOGO[o.id]}" alt="" loading="lazy">`;
    const m = MONO[o.id], k = EMK[city(o)];
    return m ? `<span class="em">${k ? `<svg class="emi" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${LM[k]}</svg>` : ""}<small>${m[0]} · ${m[1]}</small></span>` : `<b>${esc(o.name.slice(0, 4))}</b>`;
  };

  /* ---------- the price lock: figures open after the visitor sends their details (a flag only, no details kept) ---------- */
  let unlocked = sess("cc-open") === "1";
  const money = (v: number) => (unlocked ? `<span class="money">AED ${fmt(v)}</span>` : `<span class="lkm" title="${esc(t("Locked"))}">${LOCK}</span>`);
  function odometer(el: HTMLElement, value: number, open = unlocked) {
    if (!open) {
      el.innerHTML = `<span class="cur">AED</span><span class="vw" title="${esc(t("Show my price"))}"><span class="veil" aria-hidden="true">88,888</span><i class="vl">${LOCK}</i></span>`;
      el.dataset.len = ""; el.setAttribute("aria-label", t("Locked")); return;
    }
    const s = fmt(value);
    if (el.dataset.len !== String(s.length)) {
      el.innerHTML = '<span class="cur">AED</span>' + s.split("").map((ch) => (/\d/.test(ch) ? `<span class="d"><span>${"0123456789".split("").map((n) => `<b>${n}</b>`).join("")}</span></span>` : `<span>${ch}</span>`)).join("");
      el.dataset.len = String(s.length);
      void el.offsetWidth;
    }
    const ds = el.querySelectorAll<HTMLElement>(".d > span");
    let i = 0;
    s.split("").forEach((ch) => { if (/\d/.test(ch)) { const d = ds[i++]; d.style.transitionDelay = `${reduced ? 0 : i * 35}ms`; d.style.transform = `translateY(-${Number(ch) * 10}%)`; } });
    el.setAttribute("aria-label", `AED ${s}`);
  }

  /* ---------- state and steps ---------- */
  const A: CcAnswers = { residency: 0, workspace: "none", bank: false };
  let year = 1, cur = "where", started = false, completed = false, sent = false, chartSeen = false;
  const done: Record<string, boolean> = {};
  let filter = { q: "", em: "All", sort: "price" };
  const applies = (k: string) => {
    const j = A.jurisdiction;
    if (k === "where" || k === "extras" || !j) return true;
    if (k === "setup") return j !== "undecided";
    if (k === "visas") return j !== "offshore";
    if (k === "space") return j !== "offshore" && !ccUsesPackage(A);
    return true;
  };
  const order = () => STEPS.filter(([k]) => applies(k)).map(([k]) => k);
  const track = (name: string, value: unknown) => {
    if (!started) { started = true; trackCalculatorStart(CC_CALCULATOR_ID); }
    trackCalculatorStep(CC_CALCULATOR_ID, name, String(value));
  };
  const complete = () => {
    const e = ccEstimate(A);
    if (e && !completed) { completed = true; trackCalculatorComplete({ calculatorId: CC_CALCULATOR_ID, jurisdiction: jurisdictionLabel(A.jurisdiction), activity: actName(), visaCount: e.n, estimatedCost: e.total }); }
  };

  function tabs() {
    const ord = order();
    $("#tabs").innerHTML = STEPS.filter(([k]) => ord.includes(k)).map(([k, label], i) => {
      const locked = !A.jurisdiction && k !== "where";
      return `<button type="button" role="tab" data-k="${k}" aria-selected="${k === cur}" class="${done[k] ? "done" : ""}"${locked ? " disabled" : ""}><i>${done[k] && k !== cur ? "✓" : i + 1}</i><span>${t(label)}</span></button>`;
    }).join("");
    $("#prog").style.width = `${((ord.indexOf(cur) + 1) / ord.length) * 100}%`;
    // Phones show this line instead of the tabs.
    $("#stepN").innerHTML = `${t(STEPS.find(([k]) => k === cur)?.[1] ?? "")}<small>${t("Step {n} of {m}", { n: ord.indexOf(cur) + 1, m: ord.length })}</small>`;
    $("#back").hidden = ord.indexOf(cur) <= 0;
    $("#next").textContent = cur === "extras" ? (unlocked ? t("Book a call") : t("Show my price")) : t("Next");
    $<HTMLButtonElement>("#next").disabled = !A.jurisdiction || (cur === "setup" && A.option === undefined);
  }
  function go(k: string, back = false) {
    const ord = order();
    if (!ord.includes(k)) k = ord[Math.min(ord.length - 1, ord.indexOf(cur) + 1)] || "extras";
    cur = k; step(back); tabs();
    if (innerWidth <= 1000 && !reduced) { const p = $("#studio").getBoundingClientRect(); if (p.top < 0 || p.top > innerHeight * 0.5) $("#studio").scrollIntoView({ block: "start", behavior: "smooth" }); }
  }
  function next() {
    const ord = order();
    if (cur === "extras") { complete(); if (unlocked) openCall(); else openGate(); return; }
    done[cur] = true; go(ord[ord.indexOf(cur) + 1]);
  }
  on($("#next"), "click", next);
  on($("#back"), "click", () => { const ord = order(); go(ord[Math.max(0, ord.indexOf(cur) - 1)], true); });
  on($("#tabs"), "click", (e) => { const b = closest<HTMLButtonElement>(e, "button"); if (b && !b.disabled && b.dataset.k) go(b.dataset.k, order().indexOf(b.dataset.k) < order().indexOf(cur)); });

  /* ---------- the step on screen ---------- */
  function step(back = false) {
    const j = A.jurisdiction;
    let h = "";
    if (cur === "where") {
      h = `<h2>${t("Where will your company be?")}</h2><p>${t("Each jurisdiction is priced differently.")}</p><div class="grid2">` + JUR.map(([k, sub]) => {
        const from = k === "undecided" ? t(sub) : unlocked ? `${t("From")} ${money(cheapest(DATA[k]).price)}` : "";
        return `<button type="button" class="card" data-j="${k}" aria-pressed="${j === k}"><span class="ic">${svg(k)}</span><b>${t(JL[k])}</b><span>${k === "undecided" ? "" : t(sub)}</span><em>${from}</em></button>`;
      }).join("") + "</div>";
    } else if (cur === "act") {
      h = `<h2>${t("What does your business do?")}</h2><p>${t("Your activity can change the price. Your advisor checks it before anything is filed.")}</p><div class="acts">` + (Object.keys(ACT_UI) as CcActivity[]).map((k) =>
        `<button type="button" class="card" data-a="${k}" aria-pressed="${A.activity === k}"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ACT_UI[k][1]}</svg></span><span class="tx"><b>${t(activityLabel(k))}</b><span>${t(ACT_UI[k][0])}</span></span></button>`).join("") + "</div>";
    } else if (cur === "setup" && j && j !== "undecided") {
      const ems = ["All", ...DATA[j].map((o) => o.emirate).filter((e, i, a): e is string => !!e && a.indexOf(e) === i)];
      const title = { mainland: "Which mainland structure?", freezone: "Which free zone?", offshore: "Which offshore jurisdiction?" }[j];
      h = `<h2>${t(title)}</h2><p>${t("{n} options on our rate card. Search, filter or sort.", { n: DATA[j].length })}</p>` +
        `<div class="tools"><label class="search"><span class="sr">${t("Search, e.g. IFZA, trading, media")}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="q" type="search" placeholder="${esc(t("Search, e.g. IFZA, trading, media"))}" autocomplete="off" value="${esc(filter.q)}"></label><div class="chips" id="sort"><button type="button" class="chip" data-s="price" aria-pressed="${filter.sort === "price"}">${t("Lowest price")}</button><button type="button" class="chip" data-s="name" aria-pressed="${filter.sort === "name"}">${t("A to Z")}</button></div></div>` +
        (ems.length > 2 ? `<div class="chips" id="em" style="margin-top:10px">${ems.map((e) => `<button type="button" class="chip" data-e="${e}" aria-pressed="${filter.em === e}">${t(e)}</button>`).join("")}</div>` : "") +
        '<div class="list" id="list" role="list"></div>';
    } else if (cur === "visas") {
      h = `<h2>${t("How many people need UAE residency?")}</h2><p>${t("Include yourself, partners and employees.")}</p>` +
        `<div class="visas"><div class="big-n"><button type="button" id="rMinus" aria-label="${esc(t("One fewer person"))}">−</button><output id="rN">${A.residency}</output><button type="button" id="rPlus" aria-label="${esc(t("One more person"))}">+</button></div><div class="slots" id="slots" aria-hidden="true"></div></div><p class="hint" id="vHint"></p>`;
    } else if (cur === "space") {
      h = `<h2>${t("What workspace do you need?")}</h2><p>${t("Most licences and residency need some workspace.")}</p><div class="grid2">` + WS.map(([k, label, sub]) =>
        `<button type="button" class="card" data-w="${k}" aria-pressed="${A.workspace === k}"><span class="ic">${svg(k)}</span><b>${t(label)}</b><span>${t(sub)}</span><em>${!unlocked ? "" : RATES.workspace[k] ? `${money(RATES.workspace[k])} ${t("a year")}` : "–"}</em></button>`).join("") + "</div>";
    } else {
      h = `<h2>${t("Anything else?")}</h2><p>${t("Optional extras.")}</p>` +
        `<label class="tg"><input type="checkbox" id="bank"${A.bank ? " checked" : ""}><span class="tg-s"></span><span class="tg-t"><b>${t("Corporate bank account help")}</b><small>${t("We prepare and follow up your application. The bank decides.")}</small></span>${unlocked ? `<em>+${money(RATES.bank)}</em>` : ""}</label>` +
        (ccUsesPackage(A) ? `<div class="incl">${YES}${t("Workspace is included in this free zone package.")}</div>` : "") +
        `<div class="finish"><b>${t("Your setup is ready")}</b><p>${t(unlocked ? "Get it confirmed in writing, or compare it with the other jurisdictions." : "Unlock your full price, or get it confirmed in writing.")}</p>` +
        (unlocked ? `<button type="button" class="btn btn-cu" data-call data-cta-location="CC Panel — Book a call">${t("Book a 15-minute call")}${ARW}</button>` : `<button type="button" class="btn btn-cu" data-gate data-cta-location="CC Panel — Show my price">${LOCK}${t("Show my price")}</button>`) + "</div>";
    }
    $("#stepv").innerHTML = `<div class="st${back ? " back" : ""}">${h}</div>`;
    if (cur === "setup") list();
    if (cur === "visas") visas();
  }
  function list() {
    const j = A.jurisdiction;
    if (!j || j === "undecided") return;
    const q = filter.q.trim().toLowerCase();
    const items = DATA[j].filter((o) => (filter.em === "All" || o.emirate === filter.em) && (!q || `${o.name} ${nm(o)} ${o.desc} ${t(o.desc)} ${o.emirate || ""} ${t(o.emirate || "")}`.toLowerCase().includes(q)));
    items.sort((a, b) => (filter.sort === "price" ? (a.exact ? a.exact["0"] : a.price) - (b.exact ? b.exact["0"] : b.price) : nm(a).localeCompare(nm(b), lang)));
    const rp = j === "mainland" ? DATA.mainland[0].price : cheapest(DATA[j]).price;
    $("#list").innerHTML = `<button type="button" class="row rec" role="listitem" data-o="recommend" aria-pressed="${A.option === "recommend"}"><span class="rl">${svg("undecided")}</span><b>${t("Not sure, recommend one")}</b><small>${t("Priced on the most common choice for now")}</small>${unlocked ? `<span class="pr"><small>${t("From")}</small>${money(rp)}</span>` : ""}</button>` +
      (items.length ? items.map((o) => `<button type="button" class="row" role="listitem" data-o="${o.id}" aria-pressed="${A.option === o.id}"><span class="rl">${logo(o)}</span><b>${nm(o)}${o.exact ? `<span class="pk">${t("Package")}</span>` : ""}</b><small>${t(o.desc)}${o.emirate ? ` · ${t(city(o))}` : ""}</small>${unlocked ? `<span class="pr"><small>${o.exact ? t("Package") : t("From")}</small>${money(o.exact ? o.exact["0"] : o.price)}</span>` : ""}</button>`).join("") : `<p class="empty">${t("No setup matches that. Try another word or emirate.")}</p>`);
  }
  function visas() {
    const max = ccMaxResidents(A), n = A.residency;
    $("#rN").textContent = String(n);
    $<HTMLButtonElement>("#rMinus").disabled = n <= 0;
    $<HTMLButtonElement>("#rPlus").disabled = n >= max;
    $("#slots").innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < n ? "on" : ""}">${PERSON}</i>`).join("");
    $("#vHint").textContent = ccUsesPackage(A) ? t("This free zone sells packages: one published price that includes residency for up to {n} people and the workspace.", { n: max }) : t("Residency is for two years, plus a one-off establishment card. Your breakdown shows the cost.");
  }

  const later = (fn: () => void, ms = 300) => { const id = window.setTimeout(() => { if (!signal.aborted) fn(); }, reduced ? 0 : ms); timers.push(id); };
  /* A choice marks its card in place (no redraw, so nothing flashes); the next step slides in once the tick has shown. */
  const choose = (el: HTMLElement, group: string, key: string, value: string) => {
    $$(`#stepv ${group}`).forEach((c) => c.setAttribute("aria-pressed", String(c === el)));
    done[key] = true; track(key === "where" ? "jurisdiction" : key === "act" ? "activity" : key === "setup" ? "option" : "workspace", value);
    render(); tabs(); later(next, 420);
  };
  on($("#stepv"), "click", (e) => {
    const ac = closest(e, "[data-a]"), j = closest(e, "[data-j]"), o = closest(e, "[data-o]"), w = closest(e, "[data-w]"), s = closest(e, "[data-s]"), em = closest(e, "[data-e]");
    if (ac) { A.activity = ac.dataset.a as CcActivity; choose(ac, "[data-a]", "act", A.activity); return; }
    if (j) {
      const nj = j.dataset.j as Choice;
      if (nj !== A.jurisdiction) A.option = undefined;
      A.jurisdiction = nj;
      if (nj === "offshore") { A.residency = 0; A.workspace = "none"; }
      filter = { q: "", em: "All", sort: filter.sort };
      choose(j, "[data-j]", "where", nj); return;
    }
    if (o) { A.option = o.dataset.o; if (A.residency > ccMaxResidents(A)) A.residency = ccMaxResidents(A); choose(o, "[data-o]", "setup", A.option || ""); return; }
    if (w) { A.workspace = w.dataset.w as WorkspaceKey; choose(w, "[data-w]", "space", A.workspace); return; }
    if (s) { filter.sort = s.dataset.s || "price"; $$("#sort .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === s))); list(); return; }
    if (em) { filter.em = em.dataset.e || "All"; $$("#em .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === em))); list(); return; }
    const plus = closest(e, "#rPlus");
    if (plus || closest(e, "#rMinus")) { A.residency = Math.max(0, Math.min(ccMaxResidents(A), A.residency + (plus ? 1 : -1))); done.visas = true; track("residency", A.residency); visas(); render(); tabs(); }
  });
  on($("#stepv"), "input", (e) => { const i = e.target as HTMLInputElement; if (i.id === "q") { filter.q = i.value; list(); } });
  on($("#stepv"), "change", (e) => { const i = e.target as HTMLInputElement; if (i.id === "bank") { A.bank = i.checked; done.extras = true; track("bank", A.bank ? "yes" : "no"); render(); tabs(); } });

  /* ---------- the stage: price, licence card, breakdown ---------- */
  function paintCard(e: CcEstimate | null) {
    const c = $("#lic"), j = A.jurisdiction;
    if (j) c.dataset.t = j; else delete c.dataset.t;
    $("#licJ").textContent = j ? (j === "undecided" ? t("To be advised") : t(JL[j])) : t("Your company");
    const wm = $("#licWm");
    if (!wm.innerHTML) wm.innerHTML = GUILLOCHE;
    const name = $("#licName"), text = e ? (e.chosen ? shortNm(e.opt) : t("Recommended by your consultant")) : j ? t("Choose a setup") : t("Start with where it will be");
    if (name.dataset.v !== text) {
      const first = !name.dataset.v;
      name.dataset.v = text;
      if (first || reduced) name.textContent = text;
      else { name.classList.add("swap"); later(() => { name.textContent = text; name.classList.remove("swap"); }); }
    }
    const lg = $("#licLogo"), lk = e && e.chosen ? e.opt.id : "slot";
    if (lg.dataset.k !== lk) { lg.dataset.k = lk; lg.innerHTML = e && e.chosen ? `<span class="lt">${logo(e.opt)}</span>` : SLOT; }
    $("#licAct").textContent = A.activity ? t(actName()) : e && e.chosen ? t(e.opt.desc) : "";
    $("#licE").textContent = e && city(e.opt) ? t(city(e.opt)) : t("UAE");
    $("#licR").innerHTML = !e ? "–" : e.off ? t("Not applicable") : e.n ? `${e.n} ${Array.from({ length: e.n }, (_, i) => `<i style="animation-delay:${i * 50}ms"></i>`).join("")}` : t("None");
    $("#licW").textContent = !e ? "–" : e.off ? t("Not required") : e.pack ? t("Included") : t(WSN[A.workspace]);
  }
  function renderSum(e: CcEstimate | null, v: number) {
    if (!e || !A.jurisdiction) { $("#sum").innerHTML = `<p class="sum-e">${t("Not configured yet")}</p><a class="btn btn-soft sm" href="#calculator" data-cta-location="CC Quote — Start the calculator">${t("Start the calculator")}</a>`; return; }
    const rows: ([string, string] | null)[] = [
      [t("Jurisdiction"), t(JL[A.jurisdiction])], [t("Setup"), e.chosen ? nm(e.opt) : t("Recommended by your consultant")],
      A.activity ? [t("Activity"), t(actName())] : null, e.off ? null : [t("Visas"), String(e.n)], e.off || e.pack ? null : [t("Workspace"), t(WSN[A.workspace])],
      A.bank ? [t("Bank account help"), t("Yes")] : null, [t(year === 1 ? "Estimated first-year cost" : "Estimated year-two renewal"), money(v)],
    ];
    $("#sum").innerHTML = rows.filter((r): r is [string, string] => !!r).map(([k, val]) => `<div><span>${k}</span><b>${val}</b></div>`).join("");
  }
  /* the WhatsApp message to the advisor stays in English */
  function summary() {
    const e = ccEstimate(A);
    if (!e || !A.jurisdiction) return "Hello, I used the cost calculator and would like to know the cost of my company setup.";
    return "Hello, I used the cost calculator. My setup: " + [JL[A.jurisdiction], e.chosen ? e.opt.name : "recommended setup", actName(), e.off ? "" : `${e.n} visa${e.n === 1 ? "" : "s"}`, e.off || e.pack ? "" : WSN[A.workspace], A.bank ? "bank account help" : ""].filter(Boolean).join(" · ") +
      `. First-year estimate AED ${fmt(e.total)}. Please confirm the exact figure in writing.`;
  }
  let lastSig = "";
  function render() {
    const e = ccEstimate(A), j = A.jurisdiction, sig = JSON.stringify(A) + year + unlocked;
    if (sig !== lastSig) { const lic = $("#lic"); lic.classList.remove("pulse"); void lic.offsetWidth; if (!reduced && lastSig) lic.classList.add("pulse"); lastSig = sig; }
    paintCard(e);
    const v = !e ? 0 : year === 1 ? e.total : e.renewal;
    $("#stage").classList.toggle("locked", !unlocked);
    odometer($("#od"), v);
    if (!e && unlocked) { $("#od").innerHTML = '<span class="cur">AED</span>–'; $("#od").dataset.len = ""; }
    $("#pK").textContent = t(year === 1 ? "Estimated first-year cost" : "Estimated year-two renewal");
    $("#pFrom").textContent = t("From");
    $("#pFrom").hidden = !(unlocked && e && e.from && year === 1);

    const parts: [string, string, string, number | string | null][] = !e ? [] : year === 1 ? [
      ["pkg", t("Company package"), e.chosen ? "" : t(e.basis), e.base],
      ["res", e.n ? (e.n === 1 ? t("Residency for 1 person") : t("Residency for {n} people", { n: e.n })) : t("Residency"), e.off ? "" : e.pack ? t("Package price") : e.n ? t("Two years, incl. establishment card") : "", e.off ? t("Not applicable") : e.n ? e.res : t("None")],
      ["ws", t("Workspace"), e.off || e.pack || A.workspace === "none" ? "" : t(WSN[A.workspace]), e.off ? t("Not required") : e.pack ? t("Included") : e.ws || t("None")],
      ["bank", t("Bank account help"), "", A.bank ? e.bank : null],
    ] : [["pkg", t("Licence renewal"), t("About 90% of the package price"), e.renewal], ["res", t("Residency renewal"), t("Every two years"), t("Not in year two")]];
    const bar = Array.from($("#bar").children) as HTMLElement[], tot = Math.max(1, v);
    ["pkg", "res", "ws", "bank"].forEach((k, i) => { const p = parts.find((x) => x[0] === k); bar[i].style.flexGrow = p && typeof p[3] === "number" ? (unlocked ? (p[3] / tot).toFixed(3) : "1") : "0"; });
    const COL: Record<string, string> = { pkg: "var(--c-pkg)", res: "var(--c-res)", ws: "var(--c-ws)", bank: "var(--c-bank)" };
    $("#lines").innerHTML = parts.filter((p) => p[3] != null).map((p, i) => {
      const num = typeof p[3] === "number";
      return `<li style="animation-delay:${i * 60}ms"><i style="background:${COL[p[0]]}"></i><span>${p[1]}${p[2] ? `<small>${p[2]}</small>` : ""}</span><b class="${num ? "" : "t"}">${num ? money(p[3] as number) : p[3]}</b></li>`;
    }).join("");
    const plans = (["mainland", "freezone", "offshore"] as Jurisdiction[]).map((x) => ({ j: x, e: ccEstimate({ ...A, jurisdiction: x, option: j === x && A.option ? A.option : "recommend" }) as CcEstimate }));
    const low = Math.min(...plans.filter((p) => !(p.j === "offshore" && A.residency)).map((p) => p.e.total));
    $("#else").innerHTML = plans.map((p) => `<button type="button" data-load="${p.j}" aria-current="${j === p.j}" class="${unlocked && p.e.total === low && !(p.j === "offshore" && A.residency) ? "low" : ""}"><small>${t(JL[p.j])}${p.j === "offshore" && A.residency ? ` · ${t("no visas")}` : ""}</small><b>${money(p.e.total)}</b></button>`).join("");
    $("#else").hidden = !unlocked || !e;
    $("#lines").hidden = !e;
    $("#bar").hidden = !e;
    $("#pick").hidden = !!j;
    if (!j) $("#pickL").innerHTML = JUR.map(([k]) => `<button type="button" data-pick="${k}"><span class="ic">${svg(k)}</span>${t(JL[k])}</button>`).join("");
    renderSum(e, v);
    $("#stCta").innerHTML = unlocked ? t("Book a call") + ARW : LOCK + t("Show my price");
    $("#hdCta").innerHTML = unlocked ? t("Book a call") : t("Show my price");
    $$<HTMLAnchorElement>(".wa-setup").forEach((a) => { a.href = `https://wa.me/97145531546?text=${encodeURIComponent(summary())}`; });
    $("#mbarV").innerHTML = !e ? t("Start configuring") : unlocked ? (e.from ? `${t("From")} ` : "") + money(e.total) : t("Price ready");
    $("#mbarCta").innerHTML = unlocked ? t("Book a call") : LOCK + t("Show my price");
    $$(".yr button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.y) === year)));
    chart(plans, low);
  }
  function load(j: Choice, option?: string) {
    A.jurisdiction = j; A.option = option || "recommend";
    if (j === "offshore") { A.residency = 0; A.workspace = "none"; }
    if (A.residency > ccMaxResidents(A)) A.residency = ccMaxResidents(A);
    done.where = true; done.setup = true; track("jurisdiction", j);
    render(); go(option ? (applies("visas") ? "visas" : "extras") : "setup");
  }
  on($("#pick"), "click", (e) => {
    const b = closest(e, "[data-pick]"); if (!b) return;
    if (cur !== "where") go("where");
    $(`#stepv [data-j="${b.dataset.pick}"]`)?.click();
  });
  on($(".yr"), "click", (e) => { const b = closest(e, "button"); if (!b) return; year = Number(b.dataset.y); render(); });
  on($("#else"), "click", (e) => { const b = closest(e, "[data-load]"); if (b && b.dataset.load !== A.jurisdiction) load(b.dataset.load as Choice); });
  /* one main action everywhere: unlock the price, then book the call */
  const mainCta = () => (unlocked ? openCall() : openGate());
  ["#stCta", "#mbarCta", "#hdCta"].forEach((id) => on($(id), "click", mainCta));
  on(root, "click", (e) => {
    if (closest(e, "[data-call]")) openCall();
    else if (closest(e, "[data-gate]") || (closest(e, ".vw") && !closest(e, ".bud-in"))) openGate();
  });
  if (fine && !reduced) {
    const lic = $("#lic"), wrap = lic.parentElement as HTMLElement;
    on<PointerEvent>(wrap, "pointermove", (e) => { const r = lic.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; lic.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`); lic.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`); lic.style.setProperty("--sx", `${(x * 100).toFixed(1)}%`); lic.style.setProperty("--sy", `${(y * 100).toFixed(1)}%`); });
    on(wrap, "pointerleave", () => { lic.style.setProperty("--rx", "0deg"); lic.style.setProperty("--ry", "0deg"); });
  }

  /* ---------- compare ---------- */
  function chart(plans: { j: Jurisdiction; e: CcEstimate }[], low: number) {
    const max = Math.max(...plans.map((p) => p.e.total));
    const cell = (l: string, h: string, cls = "") => `<div class="c${cls ? ` ${cls}` : ""}" role="cell"${l ? ` data-l="${esc(l)}"` : ""}>${h}</div>`;
    const lab = '<div class="ct-lab" role="rowgroup">' + ["", ...(unlocked ? [t("Your price")] : []), ...CMP_ROWS.map((r) => t(r[0])), ""].map((l, i) => `<div class="c${i ? "" : " h"}" role="rowheader">${l}</div>`).join("") + "</div>";
    $("#chart").innerHTML = lab + plans.map((p, k) => {
      const isLow = unlocked && p.e.total === low && !(p.j === "offshore" && A.residency), isCur = A.jurisdiction === p.j;
      return `<div class="ct-col${isCur ? " cur" : ""}${isLow ? " low" : ""}" role="rowgroup" data-j="${p.j}">` +
        cell("", `<h3>${t(JL[p.j])}${isCur ? `<span class="badge">${t("Your selection")}</span>` : ""}</h3><p>${t(CMP_SUB[p.j])}</p>`, "h") +
        (unlocked ? cell(t("Your price"), `<div class="pr"><small>${isLow ? t("Lowest for you") : p.j === "offshore" && A.residency ? t("No residency") : t("From")}</small><b>${money(p.e.total)}</b></div><div class="track"><i style="width:${chartSeen ? (p.e.total / max) * 100 : 0}%"></i></div>`) : "") +
        CMP_ROWS.map((r) => { const v = r[k + 1]; return cell(t(r[0]), typeof v === "number" ? (v ? `<span class="yes">${YES}${t("Yes")}</span>` : `<span class="no">${NO}${t("No")}</span>`) : t(v)); }).join("") +
        cell("", `<a class="btn ${isCur ? "btn-ink" : "btn-soft"} sm" href="#calculator" data-build="${p.j}">${t(isCur ? "Edit my setup" : "Use in calculator")}</a>`, "cta") + "</div>";
    }).join("");
  }
  on($("#chart"), "click", (e) => { const b = closest(e, "[data-build]"); if (!b) return; e.preventDefault(); if (b.dataset.build !== A.jurisdiction) load(b.dataset.build as Choice); $("#calculator").scrollIntoView({ behavior: smooth }); });

  /* ---------- budget finder ---------- */
  const B = { budget: 15000, res: 0, j: "all" };
  let budUsed = false;
  function budChips() {
    $("#budR").innerHTML = [0, 1, 2, 3].map((n) => `<button type="button" class="chip" data-r="${n}" aria-pressed="${B.res === n}">${n ? people(n) : t("None")}</button>`).join("");
    $("#budJ").innerHTML = [["all", "All"], ["freezone", "Free zone"], ["mainland", "Mainland"], ["offshore", "Offshore"]].map(([k, l]) => `<button type="button" class="chip" data-bj="${k}" aria-pressed="${B.j === k}">${t(l)}</button>`).join("");
  }
  function budget() {
    const fits: { j: Jurisdiction; o: SetupOption; e: CcEstimate }[] = [];
    (["mainland", "freezone", "offshore"] as Jurisdiction[]).forEach((j) => {
      if ((B.j !== "all" && B.j !== j) || (j === "offshore" && B.res)) return;
      DATA[j].forEach((o) => {
        const a: CcAnswers = { jurisdiction: j, option: o.id, residency: B.res, workspace: "none", bank: false };
        if (o.exact && B.res > ccMaxResidents(a)) return;
        const e = ccEstimate(a);
        if (e && e.total <= B.budget) fits.push({ j, o, e });
      });
    });
    fits.sort((a, b) => a.e.total - b.e.total);
    odometer($("#budOd"), B.budget, true); // the budget is the visitor's own figure
    $("#bud").style.setProperty("--p", `${((B.budget - 5000) / 55000) * 100}%`);
    $("#budC").innerHTML = fits.length ? (fits.length === 1 ? t("1 setup fits your budget") : t("{n} setups fit your budget", { n: `<b>${fits.length}</b>` })) : t("Nothing on our rate card fits that yet. Try a higher budget or fewer people.");
    const arrow = root.dir === "rtl" ? "←" : "→";
    $("#fits").innerHTML = fits.slice(0, 6).map((f, i) => `<div class="fit" style="animation-delay:${i * 50}ms"><span class="rk">${i === 0 ? t("Lowest") : `#${i + 1}`} · ${t(JL[f.j])}</span><b>${nm(f.o)}</b><small>${t(city(f.o) || "UAE")}${f.e.pack ? ` · ${t("package")}` : ""}</small><span class="pr">${unlocked ? money(f.e.total) : `<span class="fitok">✓ ${t("Fits your budget")}</span>`}</span><a class="go" href="#calculator" data-j="${f.j}" data-o="${f.o.id}">${t("Load into the configurator")} ${arrow}</a></div>`).join("");
    $("#budMore").textContent = fits.length > 6 ? t("And {n} more. Narrow by jurisdiction, or load one to see its full breakdown.", { n: fits.length - 6 }) : "";
  }
  on($("#bud"), "input", (e) => { B.budget = Number((e.target as HTMLInputElement).value); budget(); if (!budUsed) { budUsed = true; pushEvent("budget_finder_used", { calculator_id: CC_CALCULATOR_ID }); } });
  on($("#budR"), "click", (e) => { const b = closest(e, ".chip"); if (!b) return; B.res = Number(b.dataset.r); budChips(); budget(); });
  on($("#budJ"), "click", (e) => { const b = closest(e, ".chip"); if (!b) return; B.j = b.dataset.bj || "all"; budChips(); budget(); });
  on($("#fits"), "click", (e) => { const a = closest(e, ".go"); if (!a) return; e.preventDefault(); A.residency = B.res; A.workspace = "none"; load(a.dataset.j as Choice, a.dataset.o); $("#calculator").scrollIntoView({ behavior: smooth }); });

  /* ---------- hero preview ---------- */
  let mi = 0, mHover = false;
  function heroMock() {
    const [j, id, lines] = MOCK[mi], o = DATA[j].find((x) => x.id === id) as SetupOption;
    $("#mkInd").style.setProperty("--i", String(mi));
    $$("#mkSeg b").forEach((b, i) => b.classList.toggle("on", i === mi));
    $("#mkCo").outerHTML = `<div class="mk-co" id="mkCo"><span class="lt">${logo(o)}</span><span><b>${j === "mainland" ? nm(o).split(/, |، |，/).slice(1).join(", ") : nm(o)}</b><small>${t(city(o))} · ${t(JL[j])}</small></span></div>`;
    $("#mkL").innerHTML = lines.map(([c, l, val], i) => {
      const label = l === "RES2" ? t("Residency for {n} people", { n: 2 }) : t(l), shown = val ? `AED <span class="bl">${val}</span>` : t(j === "offshore" ? "Not applicable" : "Included");
      return `<li style="animation-delay:${i * 90 + 120}ms"><i style="background:var(--c-${c})"></i><span>${label}</span><b class="${val ? "" : "t"}">${shown}</b></li>`;
    }).join("");
  }
  on($("#mock"), "click", () => $("#calculator").scrollIntoView({ behavior: smooth }));
  on($(".mock-w"), "pointerenter", () => { mHover = true; });
  on($(".mock-w"), "pointerleave", () => { mHover = false; });
  if (!reduced) timers.push(window.setInterval(() => { if (document.hidden || mHover) return; mi = (mi + 1) % MOCK.length; heroMock(); }, 3600));

  /* ---------- FAQ ---------- */
  function faq() {
    const open = $$<HTMLDetailsElement>("#faqL details").map((d) => d.open);
    $("#faqL").innerHTML = CC_FAQ.map((f, i) => {
      const [q, a] = lang === "en" ? [f[0], f[1]] : (f[2 + IX[lang]] as [string, string]);
      return `<details class="qa"${i === 0 ? ' id="faq-why"' : ""}${(open.length ? open[i] : i === 0) ? " open" : ""}><summary>${q}<i></i></summary><p>${a}</p></details>`;
    }).join("");
  }

  /* ---------- forms: the price pop-up and the written quote ---------- */
  $$<HTMLSelectElement>("#fCC, #gCC").forEach((s) => { s.innerHTML = PHONE_COUNTRIES.map((c) => `<option value="${c.code}"${c.code === DEFAULT_PHONE_COUNTRY ? " selected" : ""}>${c.dial || "+ …"}</option>`).join(""); });
  const gate = $<HTMLDialogElement>("#gate"), callD = $<HTMLDialogElement>("#callD");
  function openGate() {
    if (unlocked || gate.open) return;
    const e = ccEstimate(A);
    $("#gSum").innerHTML = e && A.jurisdiction ? [`<span>${t(JL[A.jurisdiction])}</span>`, `<span>${e.chosen ? nm(e.opt) : t("Recommended by your consultant")}</span>`, A.activity ? `<span>${t(actName())}</span>` : "", A.jurisdiction !== "offshore" ? `<span>${t("Visas")}: ${e.n}</span>` : ""].join("") : "";
    gate.showModal(); pushEvent("price_gate_open", { calculator_id: CC_CALCULATOR_ID });
    if (innerWidth > 640) $("#gName").focus();
  }
  function openCall() {
    if (callD.open) return;
    const e = ccEstimate(A);
    $("#cSum").innerHTML = e && A.jurisdiction ? [`<span>${t(JL[A.jurisdiction])}</span>`, `<span>${e.chosen ? nm(e.opt) : t("Recommended by your consultant")}</span>`, unlocked ? `<span>${money(year === 1 ? e.total : e.renewal)}</span>` : ""].join("") : "";
    callD.showModal(); pushEvent("call_popup_open", { calculator_id: CC_CALCULATOR_ID });
  }
  on($("#gX"), "click", () => gate.close());
  on($("#cX"), "click", () => callD.close());
  on(gate, "click", (e) => { if (e.target === gate) gate.close(); });
  on(callD, "click", (e) => { if (e.target === callD) callD.close(); });

  const mark = (id: string, ok: boolean) => { const i = $<HTMLInputElement>(`#${id}`); i.closest(".fl")?.classList.toggle("bad", !ok); i.setAttribute("aria-invalid", String(!ok)); return ok; };
  /** Sends one lead; returns the visitor's first name once the ERP has it, or null (and shows why). */
  async function sendLead(c: { form: HTMLFormElement; ids: [string, string, string, string]; btn: HTMLButtonElement; label: string; err: HTMLElement; source: "price" | "quote"; formId: string; formName: string }) {
    const [nameId, phoneId, emailId, ccId] = c.ids;
    const name = $<HTMLInputElement>(`#${nameId}`).value.trim(), email = $<HTMLInputElement>(`#${emailId}`).value.trim().toLowerCase();
    const country = $<HTMLSelectElement>(`#${ccId}`).value as PhoneCountry, phoneRaw = $<HTMLInputElement>(`#${phoneId}`).value;
    const phone = toE164Phone(phoneRaw, country);
    const ok = [mark(nameId, LEAD_RULES.lead_name(name)), mark(phoneId, !!phone), mark(emailId, LEAD_RULES.email_id(email))].every(Boolean);
    if (!ok) { $<HTMLInputElement>(".fl.bad input", c.form)?.focus(); return null; }
    const website = (c.form.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    complete();
    const eventId = genEventId();
    c.btn.disabled = true; c.btn.textContent = t("Sending"); c.err.hidden = true;
    const t0 = Date.now();
    let res: Response | null = null;
    try {
      res = await fetch("/api/cost-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: name, email_id: email, mobile_no: phoneRaw, country, answers: A, source: c.source, language: lang,
          whatsapp_optin: c.source === "price" && $<HTMLInputElement>("#gWa").checked,
          ...attributionFields(), event_id: eventId, landing_page: location.href.split("#")[0], form_id: c.formId, website,
        }),
      });
    } catch { /* network error: shown below */ }
    await new Promise((r) => setTimeout(r, Math.max(0, 900 - (Date.now() - t0)))); // the button never flickers
    if (signal.aborted) return null;
    c.btn.disabled = false; c.btn.textContent = t(c.label);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { fields?: string[] } | null;
      if (res?.status === 422 && body?.fields?.length) {
        body.fields.forEach((f) => mark(({ lead_name: nameId, email_id: emailId, mobile_no: phoneId } as Record<string, string>)[f] || nameId, false));
        $<HTMLInputElement>(".fl.bad input", c.form)?.focus();
        return null;
      }
      c.err.textContent = t(res?.status === 429 ? "You've sent a few requests already. Please message us on WhatsApp and we'll reply straight away." : "We could not send your details. Please try again, or message us on WhatsApp.");
      c.err.hidden = false;
      return null;
    }
    const [firstName, ...rest] = name.split(/\s+/);
    pushFormSubmit({ formId: c.formId, formName: c.formName, formType: "calculator", serviceInterest: "business_setup", email, phone: phone as string, firstName, lastName: rest.join(" "), eventId });
    pushGenerateLead({ formId: c.formId, service: "Business Setup", email, phone: phone as string });
    return firstName;
  }
  function unlock(firstName: string) {
    unlocked = true; sess("cc-open", "1"); sent = true;
    $("#doneH").dataset.name = firstName;
    $("#doneH").textContent = t("Thank you, {name}.", { name: firstName });
    $("#fm").classList.add("ok");
    lastSig = ""; render(); step(); tabs(); budget();
    // The price is on screen now: the same result-view event as the site's other calculators.
    const e = ccEstimate(A);
    if (e) trackCalculatorResultView(CC_CALCULATOR_ID, { jurisdiction: jurisdictionLabel(A.jurisdiction), estimatedCost: e.total });
  }
  let sending = false;
  on<SubmitEvent>($("#gForm"), "submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    sending = true;
    const first = await sendLead({ form: $<HTMLFormElement>("#gForm"), ids: ["gName", "gPhone", "gEmail", "gCC"], btn: $<HTMLButtonElement>("#gGo"), label: "Show my price", err: $("#gErr"), source: "price", formId: CC_PRICE_FORM_ID, formName: "Cost Calculator Price" });
    sending = false;
    if (!first) return;
    gate.close(); unlock(first);
    if (innerWidth > 1000) $("#stage").scrollIntoView({ block: "center", behavior: smooth });
  });
  on<SubmitEvent>($("#form"), "submit", async (e) => {
    e.preventDefault();
    if (sending || sent) return;
    sending = true;
    const first = await sendLead({ form: $<HTMLFormElement>("#form"), ids: ["fName", "fPhone", "fEmail", "fCC"], btn: $<HTMLButtonElement>("#fGo"), label: "Send me my written quote", err: $("#fErr"), source: "quote", formId: CC_QUOTE_FORM_ID, formName: "Cost Calculator Quote" });
    sending = false;
    if (first) unlock(first);
  });
  /* the call time is picked in the pop-up or in the quote section; both stay in step */
  on(root, "click", (e) => {
    const b = closest(e, ".call-t [data-c]"); if (!b) return;
    $$(".call-t .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.c === b.dataset.c)));
    $$(".call-ok").forEach((o) => { o.hidden = false; });
    // ponytail: the preferred time only reaches GA4; saving it on the ERP lead needs an update route keyed to the visit.
    pushEvent("call_time_selected", { calculator_id: CC_CALCULATOR_ID, call_time: b.dataset.c });
  });
  on($("#whyAsk"), "click", (e) => { e.preventDefault(); gate.close(); const d = $<HTMLDetailsElement>("#faq-why"); if (d) d.open = true; $("#faq").scrollIntoView({ behavior: smooth }); });
  $$<HTMLInputElement>(".fl input").forEach((i) => on(i, "input", () => i.closest(".fl")?.classList.remove("bad")));

  /* ---------- language: the wrapper carries lang and dir, so the root layout's <html> is left alone ---------- */
  function setLang(l: string) {
    lang = (LANGS.find(([k]) => k === l)?.[0] ?? "en") as Lang;
    root.lang = lang; root.dir = lang === "ar" ? "rtl" : "ltr";
    const font = FONTS[lang];
    if (font && !document.getElementById(`cc-font-${lang}`)) {
      const ln = document.createElement("link");
      ln.id = `cc-font-${lang}`; ln.rel = "stylesheet"; ln.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
      document.head.appendChild(ln);
    }
    $$("[data-t]:not(.lic)").forEach((el) => {
      if (!el.dataset.en) el.dataset.en = el.textContent || "";
      const tr = lang === "en" ? null : CC_TR[el.dataset.t || ""];
      el.textContent = tr ? tr[IX[lang as Exclude<Lang, "en">]] : el.dataset.en;
    });
    $$("[data-ta]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.ta || "")));
    $("#langCur").textContent = (LANGS.find(([k]) => k === lang) as [Lang, string, string])[2];
    $("#langMenu").innerHTML = LANGS.map(([k, label, code]) => `<li><button type="button" role="menuitemradio" data-l="${k}" aria-checked="${k === lang}" lang="${k}">${label}<small>${code}</small></button></li>`).join("");
    if (sent) $("#doneH").textContent = t("Thank you, {name}.", { name: $("#doneH").dataset.name || "" });
    store("cc-lang", lang);
    lastSig = ""; render(); step(); tabs(); budChips(); budget(); faq(); heroMock();
  }
  const lb = $("#langBtn"), lm = $("#langMenu");
  const closeLang = () => { lm.classList.remove("open"); lb.setAttribute("aria-expanded", "false"); };
  on(lb, "click", () => { const o = lm.classList.toggle("open"); lb.setAttribute("aria-expanded", String(o)); });
  on(lm, "click", (e) => { const b = closest(e, "[data-l]"); if (!b) return; closeLang(); setLang(b.dataset.l || "en"); pushEvent("language_change", { language: b.dataset.l }); });
  on(document, "click", (e) => { if (!closest(e, ".lang")) closeLang(); });
  on<KeyboardEvent>(document, "keydown", (e) => { if (e.key === "Escape" && lm.classList.contains("open")) { closeLang(); lb.focus(); } });

  /* ---------- scroll, reveals, spotlight ---------- */
  const hd = $("#hd"), mbar = $("#mbar"), navs = $$(".nav a"), secs = ["calculator", "compare", "budget", "faq"].map((id) => $(`#${id}`));
  function onScroll() {
    hd.classList.toggle("on", scrollY > 20);
    const st = $("#stage").getBoundingClientRect(), q = $("#quote").getBoundingClientRect();
    mbar.classList.toggle("hide", !A.jurisdiction || (st.top < innerHeight - 90 && st.bottom > 80) || (q.top < innerHeight && q.bottom > 0));
    let c = 0;
    secs.forEach((x, i) => { if (x.getBoundingClientRect().top < innerHeight * 0.4) c = i; });
    navs.forEach((a, i) => a.classList.toggle("cur", i === c));
  }
  let tick = false;
  on(window, "scroll", () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; if (!signal.aborted) onScroll(); }); } }, true);
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  observers.push(io);
  $$(".rv").forEach((el) => io.observe(el));
  observe((es, o) => es.forEach((e) => { if (e.isIntersecting) { chartSeen = true; render(); pushEvent("compare_view", { calculator_id: CC_CALCULATOR_ID }); o.disconnect(); } }), { threshold: 0.25 }, $("#chart"));
  observe((es, o) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    o.disconnect();
    if (reduced) return;
    $$(".cnt").forEach((el) => {
      const n = Number(el.dataset.n), t0 = performance.now();
      const f = (now: number) => { if (signal.aborted) return; const p = Math.min(1, (now - t0) / 1600); el.textContent = fmt(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
  }), { threshold: 0.4 }, $(".stats"));
  on<PointerEvent>(root, "pointermove", (e) => { const c = closest(e, ".card"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", `${e.clientX - r.left}px`); c.style.setProperty("--my", `${e.clientY - r.top}px`); }, true);
  $("#nOpts").textContent = String(DATA.mainland.length + DATA.freezone.length + DATA.offshore.length);
  $("#yr").textContent = String(new Date().getFullYear());

  setLang(new URLSearchParams(location.search).get("lang") || store("cc-lang") || "en");
  onScroll();
  requestAnimationFrame(() => { later(() => $(".hero").classList.add("go")); });
  observe((es, o) => es.forEach((e) => { if (e.isIntersecting) { $(".cfg").classList.add("go"); o.disconnect(); } }), { threshold: 0.12 }, $(".cfg"));
}
