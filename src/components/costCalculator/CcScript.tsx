"use client";

import { useEffect } from "react";
import { ZONE_BY_ID } from "@/content/freezone";
import { CC_CALCULATOR_ID, CC_PRICE_FORM_ID, CC_QUOTE_FORM_ID, LEAD_RULES } from "@/lib/lead";
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, toE164Phone, type PhoneCountry } from "@/lib/phone";
import { attributionFields } from "@/lib/attribution";
import { MAX_TEAM, PLAN_OPTIONS, type Jurisdiction, type PlanOption, type WorkspaceKey } from "@/lib/setupPlan";
import { genEventId, isConfirmedLeadResponse, jurisdictionLabel, pushEvent, pushFormSubmit, pushGenerateLead, trackCalculatorComplete, trackCalculatorResultView, trackCalculatorStart, trackCalculatorStep } from "@/lib/analytics";
import { wireServicesMenu } from "@/components/ui/servicesMenuHtml";

/*
  The /cost-calculator page's behaviour, ported from the design file's script: the six-step planner and its plan card,
  the comparison table, the hero preview, the "Send to an advisor" pop-up, the call pop-up and the lead forms. Advice only
  (Google Ads policy): no prices, price lock, residency step, authority logos or licence-style marks; English only. Option
  names come from lib/setupPlan, so no price data reaches the browser; /api/cost-calculator describes the choice for the
  ERP on the server. Contact clicks, form_start / form_error / form_abandon and CTA clicks are tracked site-wide
  (AnalyticsInit); this adds the calculator events, and the lead conversions only after the ERP has saved the lead.
  Everything it starts stops when the page unmounts.
*/

type Choice = Jurisdiction | "undecided";
type Activity = "trading" | "services" | "ecom" | "media" | "tech" | "other";
interface Plan { jurisdiction?: Choice; option?: string; activity?: Activity; team: number; workspace: WorkspaceKey }

const JL: Record<Choice, string> = { mainland: "Mainland", freezone: "Free zone", offshore: "Offshore", undecided: "Not sure yet" };
const JUR: [Choice, string][] = [["mainland", "Trade directly across the UAE market"], ["freezone", "International and business-to-business work"], ["offshore", "Holding structures and asset protection"], ["undecided", "We'll suggest the right one"]];
const WS: [WorkspaceKey, string, string][] = [["flexi", "Flexi-desk", "A shared desk in a business centre"], ["private", "Private office", "Your own lockable office"], ["virtual", "Virtual office", "A business address and mail"], ["none", "No workspace", "I have one, or don't need it"]];
const WSN: Record<WorkspaceKey, string> = { flexi: "Flexi-desk", private: "Private office", virtual: "Virtual office", none: "None" };
/* Same activity ids and labels as lib/costCalculator (server), kept here so the page needs no server module. */
const ACT_UI: Record<Activity, [string, string, string]> = {
  trading: ["Trading", "Import, export and general trading", '<path d="M3 7h13l-3-3M21 17H8l3 3"/>'],
  services: ["Consulting and services", "Consultancy, management and professional services", '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'],
  ecom: ["E-commerce", "Selling products online", '<path d="M3 4h2l2.5 11h11L21 7H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'],
  media: ["Media and marketing", "Advertising, content and creative work", '<path d="M3 10v4h4l6 5V5L7 10z"/><path d="M17 8a5 5 0 0 1 0 8"/>'],
  tech: ["Technology and IT", "Software, apps and IT services", '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'],
  other: ["Something else", "Your advisor will check it for you", '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01"/>'],
};
/* The sixth step (the old "Extras") keeps its place as the review step with "Your shortlist is ready". */
const STEPS: [string, string][] = [["where", "Where"], ["act", "Activity"], ["setup", "Structure"], ["team", "Team"], ["space", "Workspace"], ["review", "Review"]];

const CMP_ROWS: [string, string | number, string | number, string | number][] = [
  ["Market access", "Anywhere in the UAE, including the local market", "Inside the zone and internationally", "Outside the UAE only"],
  ["Workspace", "Office or flexi-desk in the UAE", "Flexi-desk or office in the zone", "Business address through an agent"],
  ["Staff in the UAE", 1, 1, 0],
  ["Typical activities", "Retail, contracting, local services", "Consultancies, e-commerce, international trade", "Holding companies, asset ownership"],
];
const CMP_WA: Record<Jurisdiction, string> = { mainland: "mainland", freezone: "free zone", offshore: "offshore" };
const CMP_SUB: Record<Jurisdiction, string> = { mainland: "Trade directly with customers anywhere in the UAE", freezone: "International and business-to-business work", offshore: "Holding structures and asset protection" };
const WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z"/></svg>';
const WA_BASE = "https://wa.me/97145531546";
/* hero preview: sample plans in words */
const MOCK: [Jurisdiction, string, [string, string, string][]][] = [
  ["mainland", "m0", [["pkg", "Structure", "Mainland company"], ["res", "Team", "2 people"], ["ws", "Workspace", "Flexi-desk"], ["bank", "Yearly running costs", "Planned with you"]]],
  ["freezone", "f0", [["pkg", "Structure", "Free zone company"], ["res", "Team", "Just me"], ["ws", "Workspace", "Flexi-desk"], ["bank", "Corporate tax", "Explained"]]],
  ["offshore", "o0", [["pkg", "Structure", "Offshore company"], ["res", "Staff in the UAE", "Not applicable"], ["bank", "Yearly running costs", "Planned with you"]]],
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
const SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><path d="M4 12l16-8-6 16-3-6z"/></svg>';
const YES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/></svg>';
const NO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
const PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
const SLOT = '<span class="slot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 11h.01M15 11h.01"/></svg></span>';
const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const sess = (k: string, v?: string) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch { /* storage blocked */ } return null; };
const ALL_OPTIONS = PLAN_OPTIONS.mainland.length + PLAN_OPTIONS.freezone.length + PLAN_OPTIONS.offshore.length;
/* A text monogram in the logo slot (no authority logos): the zone's short name, or the name's initials. */
const mono = (o: PlanOption) => ZONE_BY_ID[o.id]?.short[1] ?? o.name.split(/[\s,]+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 4);

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
  // English only: the old language layer is gone; this keeps the {var} fill-ins.
  const t = (s: string, vars?: Record<string, string | number>) => { let out = s; if (vars) for (const k in vars) out = out.split(`{${k}}`).join(String(vars[k])); return out; };

  const shortNm = (o: PlanOption) => o.name;
  const actName = () => (A.activity ? ACT_UI[A.activity][0] : "");
  const logo = (o: PlanOption) => `<b>${esc(mono(o))}</b>`;
  const teamTxt = (n: number) => (n >= MAX_TEAM ? `${MAX_TEAM} or more people` : n === 1 ? "Just me" : `${n} people`);

  /* ---------- state and steps ---------- */
  const A: Plan = { team: 1, workspace: "none" };
  let view2 = 1, cur = "where", started = false, completed = false;
  /* "Sent" only marks that the details went to an advisor (no details kept), so the buttons offer a call next. */
  let sent = sess("cc-sent") === "1";
  const done: Record<string, boolean> = {};
  let filter = { q: "", em: "All", sort: "name" };
  const applies = (k: string) => {
    const j = A.jurisdiction;
    if (k === "where" || k === "review" || !j) return true;
    if (k === "setup") return j !== "undecided";
    if (k === "team" || k === "space") return j !== "offshore";
    return true;
  };
  const order = () => STEPS.filter(([k]) => applies(k)).map(([k]) => k);
  const track = (name: string, value: unknown) => {
    if (!started) { started = true; trackCalculatorStart(CC_CALCULATOR_ID); }
    trackCalculatorStep(CC_CALCULATOR_ID, name, String(value));
  };
  const chosen = (): PlanOption | null => {
    const j = A.jurisdiction;
    if (!j || j === "undecided" || !A.option || A.option === "recommend") return null;
    return PLAN_OPTIONS[j].find((o) => o.id === A.option) ?? null;
  };
  const hasPlan = () => !!A.jurisdiction && (A.jurisdiction === "undecided" || A.option !== undefined);
  const complete = () => {
    if (hasPlan() && !completed) { completed = true; trackCalculatorComplete({ calculatorId: CC_CALCULATOR_ID, jurisdiction: jurisdictionLabel(A.jurisdiction), activity: actName() }); }
  };
  // The header's main button: book a consultation (the "send your plan to an advisor" pop-up), then a call.
  const mainLabel = () => (sent ? t("Book a call") : t("Book a Consultation"));

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
    // On the last step the "Your shortlist is ready" block is the one action, so Next steps aside.
    $("#next").hidden = cur === "review";
    $("#next").textContent = t("Next");
    onScroll(); // the phone bar steps aside on the last step
    $<HTMLButtonElement>("#next").disabled = !A.jurisdiction || (cur === "setup" && A.option === undefined);
  }
  function go(k: string, back = false) {
    const ord = order();
    if (!ord.includes(k)) k = ord[Math.min(ord.length - 1, ord.indexOf(cur) + 1)] || "review";
    cur = k; step(back); tabs();
    if (innerWidth <= 1000 && !reduced) { const p = $("#studio").getBoundingClientRect(); if (p.top < 0 || p.top > innerHeight * 0.5) $("#studio").scrollIntoView({ block: "start", behavior: "smooth" }); }
  }
  function next() {
    const ord = order();
    if (cur === "review") { complete(); if (sent) openCall(); else openGate(); return; }
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
      h = `<h2>${t("Where will your company be?")}</h2><p>${t("Each one suits a different kind of business.")}</p><div class="grid2">` + JUR.map(([k, sub]) =>
        `<button type="button" class="card" data-j="${k}" aria-pressed="${j === k}"><span class="ic">${svg(k)}</span><b>${t(JL[k])}</b><span>${k === "undecided" ? "" : t(sub)}</span><em>${k === "undecided" ? t(sub) : ""}</em></button>`).join("") + "</div>";
    } else if (cur === "act") {
      h = `<h2>${t("What does your business do?")}</h2><p>${t("Your activity shapes your options. Your advisor talks it through with you.")}</p><div class="acts">` + (Object.keys(ACT_UI) as Activity[]).map((k) =>
        `<button type="button" class="card" data-a="${k}" aria-pressed="${A.activity === k}"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ACT_UI[k][2]}</svg></span><span class="tx"><b>${t(ACT_UI[k][0])}</b><span>${t(ACT_UI[k][1])}</span></span></button>`).join("") + "</div>";
    } else if (cur === "setup" && j && j !== "undecided") {
      const ems = ["All", ...PLAN_OPTIONS[j].map((o) => o.emirate).filter((e, i, a): e is string => !!e && a.indexOf(e) === i)];
      const title = { mainland: "Which mainland structure?", freezone: "Which free zone?", offshore: "Which offshore jurisdiction?" }[j];
      h = `<h2>${t(title)}</h2><p>${t("{n} options to compare. Search, filter or sort.", { n: PLAN_OPTIONS[j].length })}</p>` +
        `<div class="tools"><label class="search"><span class="sr">${t("Search, e.g. IFZA, trading, media")}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="q" type="search" placeholder="${esc(t("Search, e.g. IFZA, trading, media"))}" autocomplete="off" value="${esc(filter.q)}"></label><div class="chips" id="sort"><button type="button" class="chip" data-s="emirate" aria-pressed="${filter.sort === "emirate"}">${t("By emirate")}</button><button type="button" class="chip" data-s="name" aria-pressed="${filter.sort === "name"}">${t("A to Z")}</button></div></div>` +
        (ems.length > 2 ? `<div class="chips" id="em" style="margin-top:10px">${ems.map((e) => `<button type="button" class="chip" data-e="${e}" aria-pressed="${filter.em === e}">${t(e)}</button>`).join("")}</div>` : "") +
        '<div class="list" id="list" role="list"></div>';
    } else if (cur === "team") {
      h = `<h2>${t("How many people will work in the business?")}</h2><p>${t("Include yourself, partners and employees.")}</p>` +
        `<div class="visas"><div class="big-n"><button type="button" id="rMinus" aria-label="${esc(t("One fewer person"))}">−</button><output id="rN">${A.team}</output><button type="button" id="rPlus" aria-label="${esc(t("One more person"))}">+</button></div><div class="slots" id="slots" aria-hidden="true"></div></div><p class="hint" id="vHint"></p>`;
    } else if (cur === "space") {
      h = `<h2>${t("What workspace do you need?")}</h2><p>${t("The right workspace depends on your structure and activity.")}</p><div class="grid2">` + WS.map(([k, label, sub]) =>
        `<button type="button" class="card" data-w="${k}" aria-pressed="${A.workspace === k}"><span class="ic">${svg(k)}</span><b>${t(label)}</b><span>${t(sub)}</span><em></em></button>`).join("") + "</div>";
    } else {
      h = `<h2>${t("Your plan at a glance")}</h2><p>${t("Check your choices, then send them to an advisor.")}</p>` +
        `<div class="finish"><b>${t("Your shortlist is ready")}</b><p>${t(sent ? "Book a call with your advisor, or compare it with the other jurisdictions." : "Send it to an advisor, or compare it with the other jurisdictions.")}</p>` +
        (sent ? `<button type="button" class="btn btn-cu only-desk" data-call data-cta-location="CC Panel - Book a call">${t("Book a call")}${ARW}</button><button type="button" class="btn btn-cu only-mob" data-result data-cta-location="CC Panel - See my plan">${t("See my plan")}${ARW}</button>` : `<button type="button" class="btn btn-cu" data-gate data-cta-location="CC Panel - Send to an advisor">${SEND}${t("Send to an advisor")}</button>`) + "</div>";
    }
    $("#stepv").innerHTML = `<div class="st${back ? " back" : ""}">${h}</div>`;
    if (cur === "setup") list();
    if (cur === "team") team();
  }
  function list() {
    const j = A.jurisdiction;
    if (!j || j === "undecided") return;
    const q = filter.q.trim().toLowerCase();
    const items = PLAN_OPTIONS[j].filter((o) => (filter.em === "All" || o.emirate === filter.em) && (!q || `${o.name} ${o.desc} ${o.emirate || ""}`.toLowerCase().includes(q)));
    items.sort((a, b) => (filter.sort === "emirate" ? (a.emirate || "").localeCompare(b.emirate || "") || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)));
    $("#list").innerHTML = `<button type="button" class="row rec" role="listitem" data-o="recommend" aria-pressed="${A.option === "recommend"}"><span class="rl">${svg("undecided")}</span><b>${t("Not sure, recommend one")}</b><small>${t("Your advisor suggests one that fits")}</small></button>` +
      (items.length ? items.map((o) => `<button type="button" class="row" role="listitem" data-o="${o.id}" aria-pressed="${A.option === o.id}"><span class="rl">${logo(o)}</span><b>${esc(o.name)}</b><small>${esc(o.desc)}${o.desc && o.emirate ? " · " : ""}${esc(o.emirate || "")}</small></button>`).join("") : `<p class="empty">${t("Nothing matches that. Try another word or emirate.")}</p>`);
  }
  function team() {
    const n = A.team;
    $("#rN").textContent = String(n);
    $<HTMLButtonElement>("#rMinus").disabled = n <= 1;
    $<HTMLButtonElement>("#rPlus").disabled = n >= MAX_TEAM;
    $("#slots").innerHTML = Array.from({ length: Math.min(6, Math.max(n, 3)) }, (_, i) => `<i class="${i < n ? "on" : ""}">${PERSON}</i>`).join("");
    $("#vHint").textContent = t("Count everyone who will work in the business, now and as it grows.");
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
    if (ac) { A.activity = ac.dataset.a as Activity; choose(ac, "[data-a]", "act", A.activity); return; }
    if (j) {
      const nj = j.dataset.j as Choice;
      if (nj !== A.jurisdiction) A.option = undefined;
      A.jurisdiction = nj;
      if (nj === "offshore") A.workspace = "none";
      filter = { q: "", em: "All", sort: filter.sort };
      choose(j, "[data-j]", "where", nj); return;
    }
    if (o) { A.option = o.dataset.o; choose(o, "[data-o]", "setup", A.option || ""); return; }
    if (w) { A.workspace = w.dataset.w as WorkspaceKey; choose(w, "[data-w]", "space", A.workspace); return; }
    if (s) { filter.sort = s.dataset.s || "name"; $$("#sort .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === s))); list(); return; }
    if (em) { filter.em = em.dataset.e || "All"; $$("#em .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === em))); list(); return; }
    const plus = closest(e, "#rPlus");
    if (plus || closest(e, "#rMinus")) { A.team = Math.max(1, Math.min(MAX_TEAM, A.team + (plus ? 1 : -1))); done.team = true; track("team", A.team); team(); render(); tabs(); }
  });
  on($("#stepv"), "input", (e) => { const i = e.target as HTMLInputElement; if (i.id === "q") { filter.q = i.value; list(); } });

  /* ---------- the stage: the chosen structure, the plan card, what your advisor covers ---------- */
  function paintCard() {
    const c = $("#lic"), j = A.jurisdiction, o = chosen();
    if (j) c.dataset.t = j; else delete c.dataset.t;
    $("#licJ").textContent = j ? (j === "undecided" ? t("To be advised") : t(JL[j])) : t("Your company");
    const wm = $("#licWm");
    // A faint brand mark where the old card had a security-print rosette.
    if (!wm.innerHTML) wm.innerHTML = '<img src="/brand/mark-watermark.webp" alt="" style="width:100%;height:100%;object-fit:contain">';
    const name = $("#licName"), text = o ? shortNm(o) : hasPlan() ? t("Recommended by your advisor") : j ? t("Choose a structure") : t("Choose where it will be");
    if (name.dataset.v !== text) {
      const first = !name.dataset.v;
      name.dataset.v = text;
      if (first || reduced) name.textContent = text;
      else { name.classList.add("swap"); later(() => { name.textContent = text; name.classList.remove("swap"); }); }
    }
    const lg = $("#licLogo"), lk = o ? o.id : "slot";
    if (lg.dataset.k !== lk) { lg.dataset.k = lk; lg.innerHTML = o ? `<span class="lt">${logo(o)}</span>` : SLOT; }
    $("#licAct").textContent = A.activity ? t(actName()) : o ? o.desc : "";
    $("#licE").textContent = o?.emirate ? t(o.emirate) : t("UAE");
    const off = j === "offshore";
    $("#licR").innerHTML = !hasPlan() ? "–" : off ? t("Not applicable") : `${A.team} ${Array.from({ length: Math.min(A.team, 6) }, (_, i) => `<i style="animation-delay:${i * 50}ms"></i>`).join("")}`;
    $("#licW").textContent = !hasPlan() ? "–" : off ? t("Not required") : t(WSN[A.workspace]);
  }
  /* "Your plan" in the consultation section: the choices, or an empty state with the way in */
  function renderSum() {
    const o = chosen();
    const rows = (list: [string, string][]) => `<div class="sum-rows">${list.map(([k, val]) => `<div><span>${k}</span><b>${esc(val)}</b></div>`).join("")}</div>`;
    $("#sum").classList.toggle("is-empty", !hasPlan());
    if (!hasPlan() || !A.jurisdiction) {
      // Nothing chosen yet: one slim row instead of an empty card (the form works without a plan).
      $("#sum").innerHTML = `<a class="sum-empty" href="#calculator" data-cta-location="CC Quote - Plan my company"><span class="lt">${svg("mainland")}</span><span><b>${t("No plan yet")}</b><small>${t("Your advisor can help you choose, or build it in the planner first.")}</small></span>${ARW}</a>`;
      return;
    }
    const where = [t(JL[A.jurisdiction]), o?.emirate ? t(o.emirate) : ""].filter(Boolean).join(" · ");
    const off = A.jurisdiction === "offshore";
    const list = [A.activity ? [t("Activity"), t(actName())] : null, off ? null : [t("Team"), teamTxt(A.team)], off ? null : [t("Workspace"), t(WSN[A.workspace])]].filter((r): r is [string, string] => !!r);
    $("#sum").innerHTML = `<div class="sum-h"><span class="lt">${o ? logo(o) : svg(A.jurisdiction)}</span><span><b>${esc(o ? o.name : t("Recommended by your advisor"))}</b><small>${where}</small></span></div>` +
      (list.length ? rows(list) : "") +
      `<div class="sum-t"><span>${t("Your shortlist")}</span><b>${t("Ready for your advisor")}</b></div>`;
  }
  /* the WhatsApp message to the advisor */
  function summary() {
    if (!hasPlan() || !A.jurisdiction) return "Hello, I would like advice on planning my UAE company budget.";
    const o = chosen(), off = A.jurisdiction === "offshore";
    return "Hello, I used the planner and would like advice on my UAE company. My plan: " + [JL[A.jurisdiction], o ? o.name : "advisor to recommend", actName(), off ? "" : teamTxt(A.team), off ? "" : WSN[A.workspace]].filter(Boolean).join(" · ") + ".";
  }
  let lastSig = "";
  function render() {
    const j = A.jurisdiction, o = chosen(), plan = hasPlan(), off = j === "offshore", sig = JSON.stringify(A) + view2 + sent;
    if (sig !== lastSig) { const lic = $("#lic"); lic.classList.remove("pulse"); void lic.offsetWidth; if (!reduced && lastSig) lic.classList.add("pulse"); lastSig = sig; }
    paintCard();
    const od = $("#od");
    od.classList.add("txt");
    od.textContent = !j ? t("Choose a jurisdiction") : o ? o.name : j === "undecided" ? t("Recommended by your advisor") : plan ? t("Recommended by your advisor") : t(JL[j]);
    $("#pK").textContent = t(view2 === 1 ? "Your plan" : "Your plan as you grow");
    $("#pFrom").hidden = true;

    // What your advisor covers, in the same coloured lines and bar as the old breakdown.
    const parts: [string, string, string, string][] = !plan ? [] : view2 === 1 ? [
      ["pkg", t("Structure"), o ? "" : t("Your advisor suggests one that fits"), o ? shortNm(o) : t("To be advised")],
      ["res", t("Team"), off ? "" : t("Everyone who will work in the business"), off ? t("Not applicable") : teamTxt(A.team)],
      ["ws", t("Workspace"), "", off ? t("Not required") : t(WSN[A.workspace])],
      ["bank", t("Yearly running costs"), t("Workspace, team and professional fees"), t("Planned with you")],
    ] : [
      ["pkg", t("Structure"), t("Whether it still fits as you grow"), t("Reviewed with you")],
      ["res", t("Team"), off ? "" : t("Room for the people you plan to add"), off ? t("Not applicable") : t("Planned with you")],
      ["ws", t("Workspace"), t("When a bigger space makes sense"), off ? t("Not required") : t("Reviewed with you")],
      ["bank", t("Corporate tax and bookkeeping"), t("What applies from the first year"), t("Explained")],
    ];
    const bar = Array.from($("#bar").children) as HTMLElement[];
    ["pkg", "res", "ws", "bank"].forEach((k, i) => { bar[i].style.flexGrow = parts.some((x) => x[0] === k) ? "1" : "0"; });
    const COL: Record<string, string> = { pkg: "var(--c-pkg)", res: "var(--c-res)", ws: "var(--c-ws)", bank: "var(--c-bank)" };
    $("#lines").innerHTML = parts.map((p, i) => `<li style="animation-delay:${i * 60}ms"><i style="background:${COL[p[0]]}"></i><span>${p[1]}${p[2] ? `<small>${p[2]}</small>` : ""}</span><b class="t">${esc(p[3])}</b></li>`).join("");
    $("#else").innerHTML = (["mainland", "freezone", "offshore"] as Jurisdiction[]).map((x) => `<button type="button" data-load="${x}" aria-current="${j === x}"><small>${t("Compare")}</small><b>${t(JL[x])}</b></button>`).join("");
    $("#else").hidden = !plan;
    $("#lines").hidden = !plan;
    $("#bar").hidden = !plan;
    $("#pick").hidden = !!j;
    if (!j) $("#pickL").innerHTML = JUR.map(([k]) => `<button type="button" data-pick="${k}"><span class="ic">${svg(k)}</span>${t(JL[k])}</button>`).join("");
    renderSum();
    $("#stCta").innerHTML = sent ? t("Book a call") + ARW : SEND + t("Send to an advisor");
    $("#hdCta").innerHTML = mainLabel();
    $$<HTMLAnchorElement>(".wa-setup").forEach((a) => { a.href = `${WA_BASE}?text=${encodeURIComponent(summary())}`; });
    $("#mbarV").innerHTML = !plan ? t("Choose your structure") : esc(o ? o.name : t("Plan ready"));
    // Phones and tablets, once sent: the bar names the plan and carries WhatsApp next to "Book a call".
    $("#mbar").classList.toggle("open", sent && plan);
    $("#mbarK").textContent = sent && plan ? t("Your plan") : t("Your plan");
    if (sent && plan) {
      $("#resHello").innerHTML = `${YES}${esc(t("Here's your plan, {name}", { name: $("#doneH").dataset.name || "" }))}`;
      const others = (["mainland", "freezone", "offshore"] as Jurisdiction[]).filter((x) => x !== j).map((x) => t(JL[x]));
      $("#also").innerHTML = `<div><span>${t("Also worth comparing:")}</span> ${others.join(" · ")}</div>${ARW}`;
      $("#resEdit").innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>${t("Edit my plan")}`;
    }
    $("#mbarCta").innerHTML = sent ? t("Book a call") : SEND + t("Send to an advisor");
    $$(".yr button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.y) === view2)));
    chart();
  }
  function load(j: Choice) {
    A.jurisdiction = j; A.option = "recommend";
    if (j === "offshore") A.workspace = "none";
    done.where = true; done.setup = true; track("jurisdiction", j);
    render(); go("setup");
  }
  on($("#pick"), "click", (e) => {
    const b = closest(e, "[data-pick]"); if (!b) return;
    if (cur !== "where") go("where");
    $(`#stepv [data-j="${b.dataset.pick}"]`)?.click();
  });
  on($(".yr"), "click", (e) => { const b = closest(e, "button"); if (!b) return; view2 = Number(b.dataset.y); render(); });
  on($("#else"), "click", (e) => { const b = closest(e, "[data-load]"); if (b && b.dataset.load !== A.jurisdiction) load(b.dataset.load as Choice); });
  /* one main action everywhere: send the plan to an advisor, then book the call */
  const mainCta = () => (sent ? openCall() : openGate());
  ["#stCta", "#mbarCta", "#hdCta"].forEach((id) => on($(id), "click", mainCta));
  on(root, "click", (e) => {
    if (closest(e, "[data-call]")) openCall();
    else if (closest(e, "[data-result]")) { complete(); setView("result"); $("#stage").scrollIntoView({ block: "start", behavior: smooth }); }
    else if (closest(e, "#resEdit")) { setView("steps"); go("review"); $("#studio").scrollIntoView({ block: "start", behavior: smooth }); }
    else if (closest(e, "[data-gate]")) openGate();
  });
  if (fine && !reduced) {
    const lic = $("#lic"), wrap = lic.parentElement as HTMLElement;
    on<PointerEvent>(wrap, "pointermove", (e) => { const r = lic.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; lic.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`); lic.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`); lic.style.setProperty("--sx", `${(x * 100).toFixed(1)}%`); lic.style.setProperty("--sy", `${(y * 100).toFixed(1)}%`); });
    on(wrap, "pointerleave", () => { lic.style.setProperty("--rx", "0deg"); lic.style.setProperty("--ry", "0deg"); });
  }

  /* ---------- compare ---------- */
  function chart() {
    const cell = (l: string, h: string, cls = "") => `<div class="c${cls ? ` ${cls}` : ""}" role="cell"${l ? ` data-l="${esc(l)}"` : ""}>${h}</div>`;
    const lab = '<div class="ct-lab" role="rowgroup">' + ["", ...CMP_ROWS.map((r) => t(r[0])), ""].map((l, i) => `<div class="c${i ? "" : " h"}" role="rowheader">${l}</div>`).join("") + "</div>";
    $("#chart").innerHTML = lab + (["mainland", "freezone", "offshore"] as Jurisdiction[]).map((x, k) => {
      const isCur = A.jurisdiction === x;
      return `<div class="ct-col${isCur ? " cur" : ""}" role="rowgroup" data-j="${x}">` +
        cell("", `<h3>${t(JL[x])}${isCur ? `<span class="badge">${t("Your selection")}</span>` : ""}</h3><p>${t(CMP_SUB[x])}</p>`, "h") +
        CMP_ROWS.map((r) => { const v = r[k + 1]; return cell(t(r[0]), typeof v === "number" ? (v ? `<span class="yes">${YES}${t("Yes")}</span>` : `<span class="no">${NO}${t("No")}</span>`) : t(v)); }).join("") +
        cell("", `<a class="btn ${isCur ? "btn-ink" : "btn-soft"} sm" href="${WA_BASE}?text=${encodeURIComponent(`Hello, I would like advice on a ${CMP_WA[x]} company in the UAE.`)}" target="_blank" rel="noopener" data-area="Compare ${JL[x]}">${WA}${t("Ask an advisor")}</a>`, "cta") + "</div>";
    }).join("");
  }

  /* ---------- hero preview ---------- */
  let mi = 0, mHover = false;
  function heroMock() {
    const [j, id, lines] = MOCK[mi], o = PLAN_OPTIONS[j].find((x) => x.id === id) as PlanOption;
    $("#mkInd").style.setProperty("--i", String(mi));
    $$("#mkSeg b").forEach((b, i) => b.classList.toggle("on", i === mi));
    $("#mkCo").outerHTML = `<div class="mk-co" id="mkCo"><span class="lt">${logo(o)}</span><span><b>${esc(o.name)}</b><small>${esc(o.emirate || "UAE")} · ${t(JL[j])}</small></span></div>`;
    const rows = lines.map(([c, l, val], i) => `<li style="animation-delay:${i * 90 + 120}ms"><i style="background:var(--c-${c})"></i><span>${t(l)}</span><b class="t">${t(val)}</b></li>`);
    // Always four rows, so the hero keeps its height and the page below stays put.
    while (rows.length < 4) rows.push('<li aria-hidden="true" style="visibility:hidden"><i></i><span>&nbsp;</span><b>&nbsp;</b></li>');
    $("#mkL").innerHTML = rows.join("");
    $("#mkTot").textContent = o.name;
  }
  on($("#mock"), "click", () => $("#calculator").scrollIntoView({ behavior: smooth }));
  on($(".mock-w"), "pointerenter", () => { mHover = true; });
  on($(".mock-w"), "pointerleave", () => { mHover = false; });
  if (!reduced) timers.push(window.setInterval(() => { if (document.hidden || mHover) return; mi = (mi + 1) % MOCK.length; heroMock(); }, 3600));

  /* ---------- forms: "Send to an advisor" and the consultation form ---------- */
  $$<HTMLSelectElement>("#fCC, #gCC").forEach((s) => { s.innerHTML = PHONE_COUNTRIES.map((c) => `<option value="${c.code}"${c.code === DEFAULT_PHONE_COUNTRY ? " selected" : ""}>${c.dial || "+ …"}</option>`).join(""); });
  const gate = $<HTMLDialogElement>("#gate"), callD = $<HTMLDialogElement>("#callD");
  const chipsFor = () => {
    const o = chosen();
    return hasPlan() && A.jurisdiction ? [`<span>${t(JL[A.jurisdiction])}</span>`, `<span>${esc(o ? o.name : t("Recommended by your advisor"))}</span>`, A.activity ? `<span>${t(actName())}</span>` : "", A.jurisdiction !== "offshore" ? `<span>${t("Team")}: ${A.team}</span>` : ""].join("") : "";
  };
  function openGate() {
    if (gate.open) return;
    $("#gSum").innerHTML = chipsFor();
    gate.showModal(); pushEvent("price_gate_open", { calculator_id: CC_CALCULATOR_ID });
    if (innerWidth > 640) $("#gName").focus();
  }
  function openCall() {
    if (callD.open) return;
    $("#cSum").innerHTML = chipsFor();
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
    let responseBody: { created?: unknown; fields?: string[] } | null = null;
    // The same answers shape the API has always read; no residency is asked (team size goes in the WhatsApp text).
    const answers = A.jurisdiction ? { jurisdiction: A.jurisdiction, option: A.option, activity: A.activity, residency: 0, workspace: A.workspace, bank: false } : undefined;
    try {
      res = await fetch("/api/cost-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: name, email_id: email, mobile_no: phoneRaw, country, answers, source: c.source, language: "en",
          whatsapp_optin: c.source === "price" && $<HTMLInputElement>("#gWa").checked,
          ...attributionFields(), event_id: eventId, landing_page: location.href.split("#")[0], form_id: c.formId, website,
        }),
      });
      responseBody = (await res.json().catch(() => null)) as { created?: unknown; fields?: string[] } | null;
    } catch { /* network error: shown below */ }
    await new Promise((r) => setTimeout(r, Math.max(0, 900 - (Date.now() - t0)))); // the button never flickers
    if (signal.aborted) return null;
    c.btn.disabled = false; c.btn.textContent = t(c.label);
    if (!res?.ok) {
      if (res?.status === 422 && responseBody?.fields?.length) {
        responseBody.fields.forEach((f) => mark(({ lead_name: nameId, email_id: emailId, mobile_no: phoneId } as Record<string, string>)[f] || nameId, false));
        $<HTMLInputElement>(".fl.bad input", c.form)?.focus();
        return null;
      }
      c.err.textContent = t(res?.status === 429 ? "You've sent a few requests already. Please message us on WhatsApp and an advisor will reply." : "We could not send your details. Please try again, or message us on WhatsApp.");
      c.err.hidden = false;
      return null;
    }
    if (!isConfirmedLeadResponse(responseBody)) return name.split(/\s+/)[0];
    const [firstName, ...rest] = name.split(/\s+/);
    pushFormSubmit({ formId: c.formId, formName: c.formName, formType: "calculator", serviceInterest: "business_setup", email, phone: phone as string, firstName, lastName: rest.join(" "), eventId });
    pushGenerateLead({ formId: c.formId, service: "Business Setup", email, phone: phone as string });
    return firstName;
  }
  function markSent(firstName: string) {
    sent = true; sess("cc-sent", "1");
    $("#doneH").dataset.name = firstName;
    $("#doneH").textContent = t("Thank you, {name}.", { name: firstName });
    $("#fm").classList.add("ok");
    lastSig = ""; render(); step(); tabs();
    // The shortlist is with an advisor now: the same result-view event as the site's other calculators.
    if (hasPlan()) { trackCalculatorResultView(CC_CALCULATOR_ID, { jurisdiction: jurisdictionLabel(A.jurisdiction) }); setView("result"); }
  }
  /* Phones and tablets: once sent, the steps panel gives way to the plan (desktop shows both side by side). */
  let view: "steps" | "result" = "steps";
  function setView(v: "steps" | "result") {
    view = v;
    $("#top").classList.toggle("is-result", v === "result");
    onScroll();
  }
  let sending = false;
  on<SubmitEvent>($("#gForm"), "submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    sending = true;
    const first = await sendLead({ form: $<HTMLFormElement>("#gForm"), ids: ["gName", "gPhone", "gEmail", "gCC"], btn: $<HTMLButtonElement>("#gGo"), label: "Send to an advisor", err: $("#gErr"), source: "price", formId: CC_PRICE_FORM_ID, formName: "Cost Calculator Price" });
    sending = false;
    if (!first) return;
    gate.close(); markSent(first);
    $("#stage").scrollIntoView({ block: innerWidth > 1000 ? "center" : "start", behavior: smooth });
  });
  on<SubmitEvent>($("#form"), "submit", async (e) => {
    e.preventDefault();
    if (sending || $("#fm").classList.contains("ok")) return;
    sending = true;
    const first = await sendLead({ form: $<HTMLFormElement>("#form"), ids: ["fName", "fPhone", "fEmail", "fCC"], btn: $<HTMLButtonElement>("#fGo"), label: "Book my consultation", err: $("#fErr"), source: "quote", formId: CC_QUOTE_FORM_ID, formName: "Cost Calculator Quote" });
    sending = false;
    if (first) markSent(first);
  });
  /* the call time is picked in the pop-up or in the consultation section; both stay in step */
  on(root, "click", (e) => {
    const b = closest(e, ".call-t [data-c]"); if (!b) return;
    $$(".call-t .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.c === b.dataset.c)));
    $$(".call-ok").forEach((o) => { o.hidden = false; });
    // ponytail: the preferred time only reaches GA4; saving it on the ERP lead needs an update route keyed to the visit.
    pushEvent("call_time_selected", { calculator_id: CC_CALCULATOR_ID, call_time: b.dataset.c });
  });
  on($("#whyAsk"), "click", (e) => { e.preventDefault(); gate.close(); const d = $<HTMLDetailsElement>("#faq-why"); if (d) d.open = true; $("#faq").scrollIntoView({ behavior: smooth }); });
  $$<HTMLInputElement>(".fl input").forEach((i) => on(i, "input", () => i.closest(".fl")?.classList.remove("bad")));

  /* ---------- scroll, reveals, spotlight ---------- */
  const hd = $("#hd"), mbar = $("#mbar"), navs = $$(".nav a"), secs = ["calculator", "compare", "faq"].map((id) => $(`#${id}`));
  function onScroll() {
    hd.classList.toggle("on", scrollY > 20);
    const st = $("#stage").getBoundingClientRect(), q = $("#quote").getBoundingClientRect();
    mbar.classList.toggle("hide", !A.jurisdiction || (view !== "result" && cur === "review") || (!sent && st.top < innerHeight - 90 && st.bottom > 80) || (q.top < innerHeight && q.bottom > 0));
    let c = 0;
    secs.forEach((x, i) => { if (x.getBoundingClientRect().top < innerHeight * 0.4) c = i; });
    navs.forEach((a, i) => a.classList.toggle("cur", i === c));
  }
  let tick = false;
  on(window, "scroll", () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; if (!signal.aborted) onScroll(); }); } }, true);
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  observers.push(io);
  $$(".rv").forEach((el) => io.observe(el));
  observe((es, o) => es.forEach((e) => { if (e.isIntersecting) { pushEvent("compare_view", { calculator_id: CC_CALCULATOR_ID }); o.disconnect(); } }), { threshold: 0.25 }, $("#chart"));
  on<PointerEvent>(root, "pointermove", (e) => { const c = closest(e, ".card"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", `${e.clientX - r.left}px`); c.style.setProperty("--my", `${e.clientY - r.top}px`); }, true);
  wireServicesMenu(root, signal);
  $("#nOpts").textContent = String(ALL_OPTIONS);
  $("#yr").textContent = String(new Date().getFullYear());

  render(); step(); tabs(); heroMock();
  onScroll();
  /* An ad or sitelink landing on #calculator (or ?section=calculator): the browser jumps before this script has built the
     page, so the section then sits lower. Aim again once built and loaded, unless the visitor has started scrolling.
     Anything Ads appends after the # ("#calculator?gclid=…") is ignored. */
  const want = location.hash.slice(1).split(/[?&]/)[0] || new URLSearchParams(location.search).get("section") || "";
  const target = want ? root.querySelector<HTMLElement>(`[id="${CSS.escape(want)}"]`) : null;
  if (target) {
    let moved = false;
    ["wheel", "touchmove", "keydown"].forEach((type) => on(window, type, () => { moved = true; }, true));
    const aim = () => { if (!moved) target.scrollIntoView({ block: "start", behavior: "instant" }); };
    requestAnimationFrame(aim);
    if (document.readyState === "complete") later(aim, 150);
    else on(window, "load", () => later(aim, 150));
  }
  requestAnimationFrame(() => { later(() => $(".hero").classList.add("go")); });
  observe((es, o) => es.forEach((e) => { if (e.isIntersecting) { $(".cfg").classList.add("go"); o.disconnect(); } }), { threshold: 0.12 }, $(".cfg"));
}
