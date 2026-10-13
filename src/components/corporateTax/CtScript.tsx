"use client";

import { useEffect } from "react";
import { CT_TRUST } from "@/content/corporateTax";
import { CT_ESTIMATE_FORM_ID, CT_FORM_ID, LEAD_RULES } from "@/lib/lead";
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, toE164Phone, type PhoneCountry } from "@/lib/phone";
import { attributionFields } from "@/lib/attribution";
import { computeTax, latePenalty, nextDueYear, yearEnd } from "@/lib/corporateTax";
import { genEventId, pushFormSubmit, pushGenerateLead, trackEvent } from "@/lib/analytics";

/*
  The /corporate-tax page's behaviour, ported from the design file's script: the year-end dial, the tax estimator,
  the "does it apply" checker, the late-penalty calendar, the FAQ, the stepped review form and the motion layer.
  It works on the static markup (components/corporateTax/markup). Contact clicks, form_start / form_error /
  form_abandon and CTA clicks are tracked site-wide (AnalyticsInit); this adds the page's own events, and the
  lead conversions only after /api/corporate-tax has saved the lead in the ERP.
  Every listener and loop stops when the page unmounts, and every built part is rebuilt rather than added twice.
*/

const THANK_YOU_URL = process.env.NEXT_PUBLIC_THANK_YOU_URL || "";
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MOL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const NS = "http://www.w3.org/2000/svg";
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const lastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const dstr = (d: Date) => `${d.getDate()} ${MO[d.getMonth()]} ${d.getFullYear()}`;
const escHtml = (t: string) => t.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function CtScript() {
  useEffect(() => {
    const root = document.getElementById("ctPage");
    if (!root) return;
    const ac = new AbortController();
    const signal = ac.signal;
    const observers: IntersectionObserver[] = [];
    const observe = (cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) => {
      const o = new IntersectionObserver(cb, opts);
      observers.push(o);
      return o;
    };
    const on: On = (t, type, fn, passive = false) => t.addEventListener(type, fn as EventListener, { signal, passive });
    init(root, on, observe, signal);
    return () => {
      ac.abort();
      observers.forEach((o) => o.disconnect());
    };
  }, []);
  return null;
}

type On = (t: EventTarget, type: string, fn: (e: never) => void, passive?: boolean) => void;
type Observe = (cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) => IntersectionObserver;

function init(root: HTMLElement, on: On, observe: Observe, signal: AbortSignal) {
  const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = root) => c.querySelector<T>(s) as T;
  const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = root) => Array.from(c.querySelectorAll<T>(s));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PHONE = matchMedia("(max-width: 760px)").matches;
  const loop = (fn: () => void) => { const f = () => { if (signal.aborted) return; fn(); requestAnimationFrame(f); }; requestAnimationFrame(f); };

  /* today in Dubai */
  const now = new Date(), dub = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60_000);
  const TODAY = new Date(dub.getFullYear(), dub.getMonth(), dub.getDate());
  // The year chips follow the calendar: two years back to one ahead.
  const YEARS = [-2, -1, 0, 1].map((d) => TODAY.getFullYear() + d);

  /* ---------- header, drawer, dock ---------- */
  const hd = $("#hd"), burger = $("#burger"), drawer = $("#drawer"), dock = $("#dock");
  const closeDrawer = () => { drawer.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); };
  on(burger, "click", () => { const o = drawer.classList.toggle("open"); burger.setAttribute("aria-expanded", o ? "true" : "false"); });
  $$("a", drawer).forEach((a) => on(a, "click", closeDrawer));

  /* ---------- state ---------- */
  const S = { m: 11, y: nextDueYear(TODAY) };
  const copy = $(".ft-bot span");
  if (copy) copy.textContent = copy.textContent!.replace(/\d{4}/, String(TODAY.getFullYear()));

  /* ---------- dial ---------- */
  const svg = $<SVGSVGElement>("#dialSvg"), C = 220;
  svg.replaceChildren();
  const el = (tag: string, attrs: Record<string, string | number>, parent?: Element | null) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(n);
    return n as SVGElement;
  };
  const pt = (r: number, deg: number): [number, number] => { const a = ((deg - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  const arcPath = (r: number, a0: number, a1: number) => {
    const p0 = pt(r, a0), p1 = pt(r, a1), big = a1 - a0 > 180 ? 1 : 0;
    return `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A${r} ${r} 0 ${big} 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
  };
  const defs = el("defs", {}, svg), lg = el("linearGradient", { id: "gCu", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
  el("stop", { offset: "0", "stop-color": "#e2a684" }, lg); el("stop", { offset: ".5", "stop-color": "#cc8667" }, lg); el("stop", { offset: "1", "stop-color": "#a96a4d" }, lg);
  el("circle", { cx: C, cy: C, r: 212, class: "dial-face" }, svg);
  el("circle", { cx: C, cy: C, r: 100, fill: "#faf7f5" }, svg);
  const ticks = el("g", {}, svg);
  for (let t = 0; t < 60; t++) { const mj = t % 5 === 0, a = pt(mj ? 154 : 157, t * 6), b = pt(163, t * 6); el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: "d-tick" + (mj ? " mj" : "") }, ticks); }
  const segs: SVGElement[] = [];
  for (let i = 0; i < 12; i++) segs.push(el("path", { d: arcPath(138, i * 30 + 1.2, i * 30 + 28.8), class: "d-seg" }, svg));
  el("circle", { cx: C, cy: C, r: 116, class: "d-trk" }, svg);
  const rot = el("g", { class: "d-rot", style: "transform-origin:220px 220px" }, svg);
  el("circle", { cx: C, cy: C, r: 116, class: "d-arc", pathLength: "360", transform: "rotate(-90 220 220)" }, rot);
  const dueP = pt(116, 270); el("circle", { cx: dueP[0], cy: dueP[1], r: 10, class: "d-due" }, rot);
  const yeP = pt(138, 0); el("circle", { cx: yeP[0], cy: yeP[1], r: 8, class: "d-ye" }, rot);
  const todayG = el("g", {}, svg);
  el("circle", { cx: 0, cy: 0, r: 7, class: "d-today-p" }, todayG); el("circle", { cx: 0, cy: 0, r: 7, class: "d-today" }, todayG);
  const mos: SVGElement[] = [];
  for (let j = 0; j < 12; j++) {
    const g = el("g", { class: "d-mo", "data-m": j }, svg), p = pt(188, j * 30 + 15);
    el("circle", { cx: p[0], cy: p[1], r: 19 }, g);
    el("text", { x: p[0], y: p[1] }, g).textContent = MO[j];
    mos.push(g);
  }
  // Orbit text around the dial.
  el("path", { id: "orbP", d: "M220 220m-226 0a226 226 0 1 1 452 0a226 226 0 1 1-452 0", fill: "none" }, defs);
  const orbit = el("g", { class: "d-orbit" }); svg.insertBefore(orbit, svg.childNodes[1]);
  el("textPath", { href: "#orbP" }, el("text", {}, orbit)).textContent = "FILE IT RIGHT ✦ FILE IT ON TIME ✦ CORPORATE TAX ✦ FILE IT RIGHT ✦ FILE IT ON TIME ✦ CORPORATE TAX ✦ ";
  let rotDeg: number | null = null;

  function renderDial() {
    const { m, y } = S, r = yearEnd(m, y, TODAY);
    const target = (m + 1) * 30;
    if (rotDeg === null) rotDeg = target;
    else rotDeg += ((((target - rotDeg) % 360) + 540) % 360) - 180;
    rot.style.transform = `rotate(${rotDeg}deg)`;
    segs.forEach((s, i) => { const k = (i - (m + 1) + 24) % 12; s.style.opacity = (0.18 + 0.82 * (k / 11)).toFixed(2); });
    const dueM = (m + 9) % 12;
    mos.forEach((g, i) => { g.classList.toggle("sel", i === m); g.classList.toggle("due", i === dueM && i !== m); });
    const tAng = (TODAY.getMonth() + (TODAY.getDate() - 0.5) / lastDay(TODAY.getFullYear(), TODAY.getMonth())) * 30;
    const tr = TODAY >= r.start && TODAY <= r.end ? 138 : TODAY > r.end && TODAY <= r.due ? 116 : 0;
    if (tr) { const q = pt(tr, tAng); todayG.setAttribute("transform", `translate(${q[0].toFixed(1)} ${q[1].toFixed(1)})`); todayG.style.opacity = "1"; }
    else todayG.style.opacity = "0";
    $("#dcDue").textContent = dstr(r.due);
    const st = $("#dcSt");
    if (r.days < 0) { $("#dcLeft").innerHTML = `<b>${fmt(-r.days)}</b> days overdue`; st.textContent = "Past the date"; st.className = "dc-st late"; }
    else {
      $("#dcLeft").innerHTML = `<b>${fmt(r.days)}</b> days left`;
      if (r.days <= 60) { st.textContent = "Due soon"; st.className = "dc-st soon"; }
      else { st.textContent = r.start > TODAY ? "Future period" : "On track"; st.className = "dc-st"; }
    }
    $("#dcPer").textContent = `Tax period ${r.start.getDate()} ${MO[r.start.getMonth()]} ${r.start.getFullYear()} to ${dstr(r.end)}`;
    dial.setAttribute("aria-valuenow", String(m + 1));
    dial.setAttribute("aria-valuetext", `${MOL[m]} ${y}, due ${dstr(r.due)}`);
    $$("#yrSeg button").forEach((b) => b.setAttribute("aria-checked", Number(b.dataset.y) === y ? "true" : "false"));
    $("#shYe").textContent = dstr(r.end);
    $("#shDue").textContent = dstr(r.due);
    const e1 = new Date(r.end.getFullYear(), r.end.getMonth() + 1, 1), e7 = new Date(r.end.getFullYear(), r.end.getMonth() + 7, 1);
    $("#w2").textContent = `${MO[r.start.getMonth()]} ${r.start.getFullYear()} to ${MO[m]} ${y}`;
    $("#w3").textContent = `Before ${dstr(r.end)}`;
    $("#w4").textContent = `${MO[e1.getMonth()]} ${e1.getFullYear()} to ${MO[e7.getMonth()]} ${e7.getFullYear()}`;
    $("#w5").textContent = `By ${dstr(r.due)}`;
    syncFormYe();
  }
  const yrSeg = $("#yrSeg");
  yrSeg.replaceChildren(...YEARS.map((y) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "radio"); b.dataset.y = String(y); b.textContent = String(y);
    return b;
  }));
  function setYE(m: number, y: number, src: string) {
    if (m === S.m && y === S.y) return;
    S.m = m; S.y = y; renderDial();
    trackEvent("deadline_finder_select", { year_end: `${MO[m]} ${y}`, source: src });
  }
  on(yrSeg, "click", (e: MouseEvent) => { const b = (e.target as Element).closest<HTMLElement>("button"); if (b) setYE(S.m, Number(b.dataset.y), "year"); });
  const dial = $("#dial");
  let dragging = false;
  const angFrom = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return { a: ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360, d: Math.sqrt(x * x + y * y) / (r.width / 2) };
  };
  on(dial, "pointerdown", (e: PointerEvent) => {
    const p = angFrom(e);
    if (p.d < 0.44) return;
    setYE(Math.floor(p.a / 30), S.y, "dial");
    if (e.pointerType === "mouse" || e.pointerType === "pen") { dragging = true; dial.setPointerCapture(e.pointerId); }
  });
  on(dial, "pointermove", (e: PointerEvent) => { if (dragging) setYE(Math.floor(angFrom(e).a / 30), S.y, "dial"); });
  on(dial, "pointerup", () => { dragging = false; });
  on(dial, "keydown", (e: KeyboardEvent) => {
    const first = YEARS[0], last = YEARS[YEARS.length - 1];
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setYE((S.m + 1) % 12, S.m === 11 ? Math.min(last, S.y + 1) : S.y, "key"); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setYE((S.m + 11) % 12, S.m === 0 ? Math.max(first, S.y - 1) : S.y, "key"); }
  });

  /* ---------- estimate ---------- */
  const shown: Record<string, number> = {};
  let estStarted = false, MODE = "std", lastTax: number | null = null;
  let est: Record<string, unknown> = {};
  const num = (i: HTMLInputElement) => Number(i.value.replace(/[^\d]/g, "")) || 0;
  function tween(node: Element, key: string, to: number, wrap: (v: number) => string = fmt) {
    const from = shown[key] ?? to;
    shown[key] = to;
    if (reduced || from === to) { node.textContent = wrap(to); return; }
    const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 600), ease = 1 - Math.pow(1 - k, 3); node.textContent = wrap(from + (to - from) * ease); if (k < 1 && !signal.aborted) requestAnimationFrame(step); };
    step(t0);
  }
  const F = { rev: $<HTMLInputElement>("#cRev"), np: $<HTMLInputElement>("#cNp"), ent: $<HTMLInputElement>("#cEnt"), fin: $<HTMLInputElement>("#cFin"), ex: $<HTMLInputElement>("#cEx"), loss: $<HTMLInputElement>("#cLoss"), nqi: $<HTMLInputElement>("#cNqi"), nqr: $<HTMLInputElement>("#cNqr") };
  type FKey = keyof typeof F;
  const FK = Object.keys(F) as FKey[];
  const cSbr = $<HTMLInputElement>("#cSbr"), cx = $("#estimate");
  const SCEN: Record<string, { m: string } & Record<FKey, number>> = {
    trade: { m: "std", rev: 2_400_000, np: 300_000, ent: 10_000, fin: 0, ex: 0, loss: 0, nqi: 0, nqr: 0 },
    consult: { m: "std", rev: 6_000_000, np: 1_200_000, ent: 60_000, fin: 8000, ex: 0, loss: 150_000, nqi: 0, nqr: 0 },
    fz: { m: "qfzp", rev: 12_000_000, np: 2_500_000, ent: 20_000, fin: 0, ex: 0, loss: 0, nqi: 120_000, nqr: 400_000 },
  };
  const A = (v: number) => `AED ${fmt(v)}`;
  function setRow(k: string, val: number, max: number, o: { off?: boolean; keep?: boolean; sub?: boolean; add?: boolean; label?: string; small?: string } = {}) {
    const li = $(`#wf [data-r="${k}"]`);
    li.classList.toggle("off", !!o.off);
    li.classList.toggle("nil", !o.off && !val && !o.keep);
    const sign = o.sub ? (v: number) => (v ? `(${fmt(v)})` : "0") : o.add ? (v: number) => (v ? `+${fmt(v)}` : "0") : undefined;
    tween($(`[data-k="${k}"]`, li), `wf_${k}`, val, sign);
    $(".wf-t i", li).style.width = `${(max ? Math.min(100, (Math.abs(val) / max) * 100) : 0).toFixed(2)}%`;
    if (o.label) { const l = $(".wf-l", li).firstChild; if (l) l.textContent = o.label; }
    if (o.small != null) $("small", li).textContent = o.small;
  }
  function estimate() {
    const v = Object.fromEntries(FK.map((k) => [k, num(F[k])])) as Record<FKey, number>;
    const q = MODE === "qfzp";
    cx.classList.toggle("qf", q);
    const r = computeTax(v, q, cSbr.checked);
    if (!r.sbrOk) cSbr.checked = false;
    cSbr.disabled = !r.sbrOk;
    $("#tgSbr").classList.toggle("show", r.sbrOk);
    const max = Math.max(v.np, r.adj, v.ex, v.loss, 1);
    setRow("np", v.np, max, { keep: true });
    setRow("ent", r.addEnt, max, { add: true });
    setRow("fin", v.fin, max, { add: true });
    setRow("ex", v.ex, max, { sub: true });
    setRow("adj", r.adj, max, { keep: true, label: r.adj < 0 ? "Adjusted result (loss)" : "Adjusted profit" });
    setRow("loss", r.used, max, { sub: true });
    setRow("ti", r.ti, max, { keep: true });
    setRow("sbr", r.ti, max, { sub: true, off: !r.sbr });
    setRow("b0", r.b0, max, { off: r.sbr, keep: true, small: r.qPass ? "Qualifying income" : "First AED 375,000" });
    setRow("b9", r.b9, max, { off: r.sbr, keep: true, small: r.qPass ? "Non-qualifying income" : "Everything above AED 375,000" });
    if (!unlocked) {
      // Locked: the working is still computed, but the figure is masked until the visitor leaves their details.
      $("#shTax").textContent = $("#miniTax").textContent = "•••,•••";
      est = { revenue: v.rev, net_profit: v.np, adjusted: r.adj, losses_used: r.used, taxable_income: r.ti, regime: r.qPass ? "QFZP" : "standard", sbr: r.sbr, tax: r.tax };
      return;
    }
    tween($("#shTax"), "tax", r.tax);
    $("#miniTax").textContent = fmt(r.tax);
    const tb = $(".cx-tot b");
    if (lastTax != null && lastTax !== r.tax) { tb.classList.remove("pop"); void tb.offsetWidth; tb.classList.add("pop"); }
    lastTax = r.tax;
    const eff = v.np > 0 ? (r.tax / v.np) * 100 : 0;
    $("#shEff").textContent = `${eff.toFixed(1)}%`;
    $("#gF").style.strokeDasharray = `${Math.min(100, (eff / 9) * 100).toFixed(1)} 100`;
    const W: [string, string][] = [];
    if (r.qFail) W.push(["warn", `Your non-qualifying revenue of ${A(v.nqr)} is above the limit of ${A(r.limit)} (5% of revenue or AED 5 million, whichever is lower). That would mean losing Qualifying Free Zone status, so this shows the standard calculation.`]);
    if (r.addEnt + v.fin > 0) W.push(["", `${A(r.addEnt + v.fin)} was added back, because half of entertainment and all fines are not deductible.`]);
    if (v.ex > 0) W.push(["", `${A(v.ex)} of exempt income was taken out, so it is not taxed.`]);
    if (r.adj < 0) W.push(["", `After adjustments you have a loss of ${A(-r.adj)}. No tax is due, and the loss can be carried forward to reduce tax in later years.`]);
    else if (r.sbr) W.push(["", `With Small Business Relief you are treated as having no taxable income this period, so no tax is due. You still file a return.${v.loss ? ` Your ${A(v.loss)} of losses cannot be used this year and stay available for later.` : ""}`]);
    else {
      if (v.loss > 0) W.push(["", r.used < v.loss ? `Losses can only cut up to 75% of adjusted profit, so ${A(r.used)} was used this year and ${A(v.loss - r.used)} carries forward.` : `All ${A(r.used)} of your earlier losses were used.`]);
      if (r.qPass) W.push(["", `As a Qualifying Free Zone Person, qualifying income is taxed at 0% and only the ${A(r.b9)} of non-qualifying income is taxed at 9%. The AED 375,000 band does not apply.`]);
      else if (r.ti <= 375_000) W.push(["", `Your taxable income of ${A(r.ti)} is within the first AED 375,000, which is taxed at 0%. No tax is due, but you still need a Corporate Tax number and a return.`]);
      else W.push(["", `The first AED 375,000 is taxed at 0%. The remaining ${A(r.b9)} is taxed at 9%, which comes to ${A(r.tax)}.`]);
      if (r.sbrOk && r.tax > 0) W.push(["", "Your revenue is AED 3 million or less, so Small Business Relief could bring this to AED 0. Switch it on to compare."]);
    }
    $("#why").innerHTML = W.map(([c, t], i) => `<li class="${c}" style="animation-delay:${i * 50}ms">${t}</li>`).join("");
    const hot = r.sbr || r.adj < 0 ? 3 : r.tax > 0 ? 4 : 3;
    $$(".cx-flow li").forEach((li, i) => li.classList.toggle("hot", i === hot));
    est = { revenue: v.rev, net_profit: v.np, adjusted: r.adj, losses_used: r.used, taxable_income: r.ti, regime: r.qPass ? "QFZP" : "standard", sbr: r.sbr, tax: r.tax };
  }
  // The estimate opens once per visit (only a flag is stored, never the visitor's details).
  const UNLOCK_KEY = "ct-estimate-open";
  let unlocked = false;
  try { unlocked = sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch { /* storage blocked: stays locked */ }
  cx.classList.toggle("locked", !unlocked);
  $("#miniCta").textContent = unlocked ? "See the working" : "Show my estimate";
  function unlock() {
    unlocked = true;
    try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch { /* ignore */ }
    cx.classList.remove("locked");
    cx.classList.add("unlocked");
    $("#miniCta").textContent = "See the working";
    shown.tax = 0; // the figure counts up from zero
    estimate();
  }
  const startEst = () => { if (!estStarted) { estStarted = true; trackEvent("tax_estimator_start"); } };
  const clearScen = () => $$("#scen button").forEach((b) => b.classList.remove("on"));
  const setMode = (m: string) => { MODE = m; $$("#cxMode button").forEach((b) => b.setAttribute("aria-checked", b.dataset.m === m ? "true" : "false")); };
  FK.forEach((k) => {
    const inp = F[k];
    on(inp, "input", () => { const v = num(inp); inp.value = v ? fmt(v) : ""; startEst(); clearScen(); estimate(); });
    on(inp, "focus", () => setTimeout(() => inp.select(), 0));
  });
  on($("#cxMode"), "click", (e: MouseEvent) => { const b = (e.target as Element).closest<HTMLElement>("button"); if (!b) return; setMode(b.dataset.m || "std"); startEst(); clearScen(); estimate(); });
  on(cSbr, "change", () => { startEst(); estimate(); });
  const openAdv = (o: boolean) => { $("#cxAdv").classList.toggle("open", o); $("#cxMore").setAttribute("aria-expanded", o ? "true" : "false"); };
  on($("#cxMore"), "click", () => { const o = !$("#cxAdv").classList.contains("open"); openAdv(o); if (o) trackEvent("tax_estimator_details_open"); });
  on($("#wkB"), "click", () => { const o = $("#wk").classList.toggle("open"); $("#wkB").setAttribute("aria-expanded", o ? "true" : "false"); if (o) trackEvent("tax_estimator_working_open"); });
  on($("#scen"), "click", (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>("button");
    const sc = b && SCEN[b.dataset.s || ""];
    if (!b || !sc) return;
    if (sc.ent || sc.fin || sc.ex || sc.loss) openAdv(true);
    setMode(sc.m);
    cSbr.checked = false;
    FK.forEach((k) => { F[k].value = fmt(sc[k]); });
    $$("#scen button").forEach((x) => x.classList.toggle("on", x === b));
    startEst(); estimate();
    trackEvent("tax_scenario_select", { scenario: b.textContent });
  });
  on($("#shCta"), "click", () => {
    trackEvent("tax_estimator_complete", { estimate: est });
    const rev = num(F.rev);
    prefill(null, rev <= 1_000_000 ? "Up to AED 1 million" : rev <= 3_000_000 ? "AED 1M to 3M" : rev <= 50_000_000 ? "AED 3M to 50M" : "Above AED 50M", MODE === "qfzp" ? "Free zone company" : null);
  });
  {
    const mini = $("#cxMini");
    let inV = false, shV = false;
    const o1 = observe((es) => {
      es.forEach((e) => { if (e.target.classList.contains("cx-in")) inV = e.isIntersecting; else shV = e.isIntersecting; });
      const sh = inV && !shV;
      mini.classList.toggle("show", sh);
      root.classList.toggle("mini-on", sh && innerWidth <= 900);
    }, { threshold: [0, 0.15] });
    o1.observe($(".cx-in")); o1.observe($(".cx-tot"));
  }
  observe((es, o) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); } }), { threshold: 0.3 }).observe($(".cx-flow"));

  /* ---------- does it apply ---------- */
  const AP = { t: "mainland", r: "3" };
  const TN: Record<string, string> = { mainland: "Mainland company", freezone: "Free zone company", person: "In your own name", holding: "Holding company" };
  const RN: Record<string, string> = { "1": "up to AED 1M", "3": "AED 1M to 3M", "50": "AED 3M to 50M", "51": "above AED 50M" };
  const CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/></svg>';
  function applies() {
    const { t, r } = AP;
    let L: string[] = [];
    $("#apH").textContent = `${TN[t]}, ${RN[r]}`;
    if (t === "person" && r === "1") {
      $("#apP").textContent = "Corporate Tax does not apply to you yet.";
      L = ["Business turnover of AED 1 million or less in a calendar year is outside Corporate Tax", "Once turnover goes above AED 1 million, you need a Corporate Tax number and a yearly return", "Keep your records, so you can show your turnover if asked"];
    } else {
      $("#apP").textContent = "Here is what applies to you.";
      L.push("A Corporate Tax number from the FTA, if you do not have one yet", "A return every year, filed and paid within 9 months of your year end");
      if (t === "freezone") L.push("0% on qualifying income if you meet the Qualifying Free Zone Person conditions, 9% on the rest", "Audited financial statements and real activity in your free zone, to keep the 0% rate");
      else L.push("0% on the first AED 375,000 of taxable profit, 9% above it");
      if (t === "person") L.push("This applies because your business turnover is above AED 1 million a year");
      if (t === "holding") L.push("Dividends and gains from qualifying shareholdings may be exempt, if the conditions are met");
      if (r === "1" || r === "3") L.push(t === "freezone" ? "Small Business Relief is an option for periods ending by 31 Dec 2029, but not together with the free zone 0% rate" : "You may elect Small Business Relief for tax periods ending by 31 Dec 2029");
      if (r === "51" && t !== "freezone") L.push("Audited financial statements, as revenue is above AED 50 million");
      L.push("Accounts and records kept for 7 years");
    }
    $("#apList").innerHTML = L.map((x, i) => `<li style="animation-delay:${i * 60}ms">${CHK}<span>${x}</span></li>`).join("");
  }
  const radioGroup = (id: string, key: "t" | "r") =>
    on($(id), "click", (e: MouseEvent) => {
      const b = (e.target as Element).closest<HTMLElement>(".opt");
      if (!b) return;
      $$(".opt", $(id)).forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false"));
      AP[key] = b.dataset.v || "";
      applies();
      trackEvent("business_type_select", { business_type: TN[AP.t], revenue_band: RN[AP.r] });
    });
  radioGroup("#apT", "t");
  radioGroup("#apR", "r");
  on($("#apCta"), "click", () => {
    const bm: Record<string, string> = { mainland: "Mainland company", freezone: "Free zone company", person: "Freelancer or sole trader", holding: "Holding company" };
    const rm: Record<string, string> = { "1": "Up to AED 1 million", "3": "AED 1M to 3M", "50": "AED 3M to 50M", "51": "Above AED 50M" };
    prefill(bm[AP.t], rm[AP.r]);
  });

  /* ---------- late calendar ---------- */
  const cal = $("#cal");
  let ltN = 3, calUsed = false;
  cal.replaceChildren(...Array.from({ length: 24 }, (_, i) => {
    const c = i + 1, cb = document.createElement("button");
    cb.style.setProperty("--d", String(c)); cb.type = "button"; cb.textContent = String(c); cb.dataset.n = String(c);
    cb.setAttribute("aria-label", `${c} month${c > 1 ? "s" : ""} late`);
    return cb;
  }));
  function late() {
    $$("button", cal).forEach((b) => {
      const n = Number(b.dataset.n);
      b.className = n <= ltN ? (n <= 12 ? "f1" : "f2") : "";
      if (n === ltN) b.classList.add("cur");
      b.setAttribute("aria-pressed", n === ltN ? "true" : "false");
    });
    tween($("#ltAmt"), "late", latePenalty(ltN));
    $("#late").style.setProperty("--heat", ((Math.min(ltN, 24) / 24) * 0.55).toFixed(3));
    const la = $(".lt-amt"); la.classList.remove("pop"); void la.offsetWidth; la.classList.add("pop");
    $("#ltMo").innerHTML = `<b>${ltN} month${ltN > 1 ? "s" : ""}</b> late, return penalty only`;
  }
  on(cal, "click", (e: MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>("button");
    if (!b) return;
    ltN = Number(b.dataset.n);
    late();
    if (!calUsed) { calUsed = true; trackEvent("penalty_meter_used"); }
  });

  /* ---------- FAQ ---------- */
  $$("#faqList .qa button").forEach((b) => on(b, "click", () => {
    const qa = b.parentElement as HTMLElement, open = !qa.classList.contains("open");
    $$("#faqList .qa").forEach((x) => { x.classList.remove("open"); $("button", x).setAttribute("aria-expanded", "false"); });
    if (open) { qa.classList.add("open"); b.setAttribute("aria-expanded", "true"); trackEvent("faq_expand", { faq_question: (b.textContent || "").slice(0, 80) }); }
  }));

  /* ---------- stepped review form ---------- */
  const form = $<HTMLFormElement>("#form"), cc = $<HTMLSelectElement>("#fCC");
  let step = 1, yeTouched = false, sending = false, sent = false;
  cc.innerHTML = PHONE_COUNTRIES.map((c) => `<option value="${c.code}"${c.code === DEFAULT_PHONE_COUNTRY ? " selected" : ""}>${c.code === "OTHER" ? "Other" : c.dial}</option>`).join("");
  $("#chMo").innerHTML = MO.map((m, i) => `<label><input type="radio" name="ye_m" value="${i}"><span>${m}</span></label>`).join("");
  $("#chYr").innerHTML = YEARS.map((y) => `<label><input type="radio" name="ye_y" value="${y}"><span>${y}</span></label>`).join("") + '<label><input type="radio" name="ye_y" value="ns"><span>Not sure</span></label>';
  const setRadio = (name: string, v: string | number) => { const r = form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${v}"]`); if (r) r.checked = true; };
  function syncFormYe() { if (!yeTouched) { setRadio("ye_m", S.m); setRadio("ye_y", S.y); } }
  const val = (name: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? "";
  const yeText = () => { const y = val("ye_y"), m = val("ye_m"); return y === "ns" ? "Not sure" : (m !== "" ? `${MO[Number(m)]} ` : "") + y; };
  function summary() {
    const a: string[] = [];
    if (step > 1 && val("biz")) a.push(val("biz"));
    if (step > 2) a.push(`Year end ${yeText()}`);
    if (step > 3 && val("revenue")) a.push(val("revenue"));
    $("#fmSum").innerHTML = a.map((x) => `<span>${escHtml(x)}</span>`).join("");
  }
  function go(n: number) {
    const prev = step;
    step = n;
    $$(".step", form).forEach((s) => { const k = Number(s.dataset.s); s.classList.toggle("cur", k === n); s.classList.toggle("past", k < n); s.toggleAttribute("inert", k !== n); });
    $$(".fm-bar i").forEach((b, i) => b.classList.toggle("on", i < n));
    $("#fmN").textContent = `Step ${n} of 4`;
    $("#fmBack").hidden = n === 1;
    $("#fmNext").textContent = n === 4 ? "Book my free tax review" : "Next";
    summary();
    if (n > prev) trackEvent("form_step", { form_name: "corporate_tax_review", step: n });
    if (n === 4 && prev < 4) setTimeout(() => { if (innerWidth > 640) $("#fName").focus({ preventScroll: true }); }, 350);
  }
  $$(".step", form).forEach((s) => s.toggleAttribute("inert", Number(s.dataset.s) !== 1));
  function prefill(biz: string | null, rev: string | null, bizFallback?: string | null) {
    if (biz) setRadio("biz", biz);
    else if (bizFallback && !val("biz")) setRadio("biz", bizFallback);
    if (rev) setRadio("revenue", rev);
  }
  on(form, "change", (e: Event) => {
    const n = (e.target as HTMLInputElement).name;
    if (n === "ye_m" || n === "ye_y") yeTouched = true;
  });
  // A tap on an answer moves on, even when it was already chosen (the year comes pre-filled from the dial).
  on(form, "click", (e: MouseEvent) => {
    const t = e.target as HTMLInputElement;
    if (t.type !== "radio") return;
    if (t.name === "biz" && step === 1) setTimeout(() => go(2), 260);
    if (t.name === "ye_y" && step === 2) setTimeout(() => go(3), 260);
    if (t.name === "revenue" && step === 3) setTimeout(() => go(4), 260);
  });
  on($("#fmBack"), "click", () => { if (step > 1) go(step - 1); });
  const mark = (id: string, ok: boolean) => {
    const input = $<HTMLInputElement>(`#${id}`);
    input.closest(".fl")?.classList.toggle("bad", !ok);
    input.setAttribute("aria-invalid", ok ? "false" : "true"); // read by the site's form_error tracking
    return ok;
  };
  /**
   * Checks the contact fields, posts the lead to /api/corporate-tax and, only once the ERP has it, pushes
   * form_submit and generate_lead. Returns the first name on success, null otherwise (errors are shown in place).
   */
  async function sendLead(c: {
    form: HTMLFormElement; ids: { name: string; phone: string; email: string }; cc: HTMLSelectElement;
    btn: HTMLButtonElement; btnText: string; errBox: HTMLElement;
    formId: string; formName: string; formType: string; fields: Record<string, unknown>;
  }): Promise<string | null> {
    const name = $<HTMLInputElement>(`#${c.ids.name}`).value.trim(), email = $<HTMLInputElement>(`#${c.ids.email}`).value.trim().toLowerCase();
    const country = c.cc.value as PhoneCountry, phoneRaw = $<HTMLInputElement>(`#${c.ids.phone}`).value;
    const phone = toE164Phone(phoneRaw, country);
    const ok = [mark(c.ids.name, LEAD_RULES.lead_name(name)), mark(c.ids.phone, !!phone), mark(c.ids.email, LEAD_RULES.email_id(email))].every(Boolean);
    if (!ok) { $<HTMLInputElement>(".fl.bad input", c.form)?.focus(); return null; }
    const eventId = genEventId();
    c.btn.disabled = true; c.btn.textContent = "Sending"; c.errBox.hidden = true;
    const t0 = Date.now();
    let res: Response | null = null;
    try {
      res = await fetch("/api/corporate-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_name: name, email_id: email, mobile_no: phoneRaw, country, ...c.fields,
          ...attributionFields(), event_id: eventId, landing_page: location.href.split("#")[0],
          form_id: c.formId, website: (c.form.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "",
        }),
      });
    } catch { /* network error: shown below */ }
    await new Promise((r) => setTimeout(r, Math.max(0, 900 - (Date.now() - t0)))); // the button never flickers
    if (!res?.ok) {
      c.btn.disabled = false; c.btn.textContent = c.btnText;
      const body = (await res?.json().catch(() => null)) as { fields?: string[] } | null;
      if (res?.status === 422 && body?.fields?.length) {
        body.fields.forEach((f) => mark(({ lead_name: c.ids.name, email_id: c.ids.email, mobile_no: c.ids.phone } as Record<string, string>)[f] || c.ids.name, false));
        $<HTMLInputElement>(".fl.bad input", c.form)?.focus();
        return null;
      }
      c.errBox.textContent = res?.status === 429
        ? "You've sent a few requests already. Please message us on WhatsApp and we'll reply straight away."
        : "We could not send your details. Please try again, or message us on WhatsApp.";
      c.errBox.hidden = false;
      return null;
    }
    const [firstName, ...rest] = name.split(/\s+/);
    pushFormSubmit({ formId: c.formId, formName: c.formName, formType: c.formType, serviceInterest: "corporate_tax", email, phone: phone as string, firstName, lastName: rest.join(" "), eventId });
    pushGenerateLead({ formId: c.formId, service: "Corporate Tax", email, phone: phone as string });
    return firstName;
  }
  /** The review form shows its thank-you (also after the estimate pop-up: the same person is not asked twice). */
  const reviewDone = (firstName: string) => { sent = true; $("#doneH").textContent = `Thank you, ${firstName}.`; $("#fm").classList.add("done"); };
  on(form, "submit", async (e: SubmitEvent) => {
    e.preventDefault();
    if (step < 4) { go(step + 1); return; }
    if (sending || sent) return;
    sending = true;
    const firstName = await sendLead({
      form, ids: { name: "fName", phone: "fPhone", email: "fEmail" }, cc,
      btn: $<HTMLButtonElement>("#fmNext"), btnText: "Book my free tax review", errBox: $("#fmErr"),
      formId: CT_FORM_ID, formName: "Corporate Tax Review", formType: "consultation",
      fields: { business_type: val("biz") || "Not sure", year_end: yeText(), revenue: val("revenue") || "Prefer not to say", estimate: estimateNote() },
    });
    sending = false;
    if (!firstName) return;
    if (THANK_YOU_URL) { window.location.assign(THANK_YOU_URL); return; }
    reviewDone(firstName);
    confetti();
    $("#fm").scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------- estimate pop-up: the figure opens once the visitor leaves their details ---------- */
  const ux = $<HTMLDialogElement>("#ux"), uxForm = $<HTMLFormElement>("#uxForm"), uxCC = $<HTMLSelectElement>("#uxCC");
  uxCC.innerHTML = cc.innerHTML;
  let uxSending = false;
  const openGate = () => {
    if (unlocked || ux.open) return;
    ux.showModal();
    trackEvent("tax_estimate_gate_open");
    if (innerWidth > 640) $("#uxName").focus();
  };
  on($("#lockBtn"), "click", openGate);
  on($("#uxX"), "click", () => ux.close());
  on(ux, "click", (e: MouseEvent) => { if (e.target === ux) ux.close(); }); // a tap on the backdrop
  on(uxForm, "submit", async (e: SubmitEvent) => {
    e.preventDefault();
    if (uxSending || unlocked) return;
    uxSending = true;
    const rev = num(F.rev);
    const firstName = await sendLead({
      form: uxForm, ids: { name: "uxName", phone: "uxPhone", email: "uxEmail" }, cc: uxCC,
      btn: $<HTMLButtonElement>("#uxGo"), btnText: "Show my tax estimate", errBox: $("#uxErr"),
      formId: CT_ESTIMATE_FORM_ID, formName: "Corporate Tax Estimate", formType: "calculator",
      fields: {
        source: "estimate", business_type: MODE === "qfzp" ? "Free zone company" : "Not sure", year_end: `${MO[S.m]} ${S.y}`,
        revenue: rev <= 1_000_000 ? "Up to AED 1 million" : rev <= 3_000_000 ? "AED 1M to 3M" : rev <= 50_000_000 ? "AED 3M to 50M" : "Above AED 50M",
        estimate: estimateNote(true),
      },
    });
    uxSending = false;
    if (!firstName) return;
    ux.close();
    unlock();
    reviewDone(firstName);
    trackEvent("tax_estimator_complete", { estimate: est });
    $("#sheet").scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  });
  // One line for the ERP notes, when the visitor used the estimator.
  const estimateNote = (always = false) => (estStarted || always ? `Estimated tax AED ${fmt(Number(est.tax) || 0)} (revenue AED ${fmt(Number(est.revenue) || 0)}, net profit AED ${fmt(Number(est.net_profit) || 0)}, ${est.regime === "QFZP" ? "Qualifying Free Zone Person" : "standard rates"}${est.sbr ? ", Small Business Relief" : ""})` : "");
  $$(".fl input").forEach((i) => on(i, "input", () => { const fl = i.closest(".tel")?.parentElement ?? i.closest(".fl"); fl?.classList.remove("bad"); i.setAttribute("aria-invalid", "false"); }));

  /* ---------- scroll ---------- */
  const navLinks = $$(".hd-nav a"), secs = ["top", "estimate", "apply", "late", "faq"].map((id) => document.getElementById(id));
  const bookSec = $("#book");
  let ticking = false;
  function onScroll() {
    ticking = false;
    hd.classList.toggle("on", scrollY > 10);
    const br = bookSec.getBoundingClientRect();
    dock.classList.toggle("hide", scrollY < 300 || (br.top < innerHeight && br.bottom > 0));
    let cur = 0;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle("cur", i === cur && scrollY > 200));
    maxScroll();
  }
  on(window, "scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, true);
  on(window, "resize", onScroll);

  /* ---------- motion: split headings, reveals, counters ---------- */
  const fine = matchMedia("(pointer: fine)").matches;
  $$(".split").forEach((h) => {
    if (h.querySelector(".sw")) return; // already split
    let i = 0;
    const walk = (n: Node) => {
      Array.from(n.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          (c.textContent || "").split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
            const o = document.createElement("span"), inn = document.createElement("span");
            o.className = "sw"; inn.textContent = w; inn.style.setProperty("--i", String(i++));
            o.appendChild(inn); frag.appendChild(o);
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !(c as Element).classList.contains("sw")) walk(c);
      });
    };
    walk(h);
  });
  const io = observe((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
  $$(".split").forEach((h) => { if (h.id !== "h1") io.observe(h); });
  requestAnimationFrame(() => setTimeout(() => { $("#h1").classList.add("in"); $(".hero").classList.add("go"); }, 80));
  // Fade-up: content blocks rise in gently as they reach the screen; siblings are staggered.
  if (!reduced) {
    const fu = observe((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); fu.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(".sec-h p, .cx-sc, .cx-in, .ap-g > *, .lt-g > *, .tc, .bg-i, .qa, .fq-side > p, .fq-side > .btn, .bk-side > p, .bk-con, .fm, .yc").forEach((n) => {
      if (n.classList.contains("in")) return;
      n.classList.add("fu");
      n.style.setProperty("--fd", String(Math.min(Array.prototype.indexOf.call(n.parentElement?.children ?? [], n), 5)));
      fu.observe(n);
    });
  }
  const io2 = observe((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io2.unobserve(e.target);
    const t = e.target as HTMLElement;
    if (t.id === "stamp") { setTimeout(() => t.classList.add("in"), 300); return; }
    const to = Number(t.dataset.to), t0 = performance.now(), d = reduced ? 0 : 1600;
    const st = (tm: number) => { const k = d ? Math.min(1, (tm - t0) / d) : 1; t.textContent = fmt(to * (1 - Math.pow(1 - k, 4))); if (k < 1 && !signal.aborted) requestAnimationFrame(st); };
    st(t0);
  }), { threshold: 0.4 });
  io2.observe($("#stamp"));
  $$(".cnt").forEach((c) => io2.observe(c));

  /* tilt, chip parallax, magnetic buttons and the custom cursor (mouse only) */
  const stage = $("#stage"), sheet = $("#sheet");
  if (fine && !reduced) {
    on(stage, "pointermove", (e: PointerEvent) => {
      if (dragging) return;
      const r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      dial.style.transform = `perspective(1200px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`;
      $$(".fchip", stage).forEach((c) => { const d = Number(c.dataset.d); c.style.setProperty("--mx", `${x * 30 * d}px`); c.style.setProperty("--my", `${y * 30 * d}px`); });
    });
    on(stage, "pointerleave", () => { dial.style.transform = ""; $$(".fchip", stage).forEach((c) => { c.style.setProperty("--mx", "0px"); c.style.setProperty("--my", "0px"); }); });
    on(sheet, "pointermove", (e: PointerEvent) => { const r = sheet.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; sheet.style.transform = `perspective(1400px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`; });
    on(sheet, "pointerleave", () => { sheet.style.transform = ""; });
    $$(".opt").forEach((o) => on(o, "pointermove", (e: PointerEvent) => { const r = o.getBoundingClientRect(); o.style.setProperty("--ox", `${e.clientX - r.left}px`); o.style.setProperty("--oy", `${e.clientY - r.top}px`); }));
    $$(".btn-cu,.btn-ink").forEach((b) => {
      on(b, "pointermove", (e: PointerEvent) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px,${(e.clientY - r.top - r.height / 2) * 0.25}px)`; });
      on(b, "pointerleave", () => { b.style.transform = ""; });
    });
    const cr = $("#curR"), cd = $("#curD");
    let mx = -100, my = -100, rx = -100, ry = -100;
    on(window, "pointermove", (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY;
      root.classList.add("cur-on");
      cd.style.transform = `translate(${mx}px,${my}px)`;
      cr.classList.toggle("cur-big", !!(e.target as Element).closest?.("a,button,label,.d-mo,input,select"));
    }, true);
    on(document, "pointerleave", () => root.classList.remove("cur-on"));
    loop(() => { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; cr.style.transform = `translate(${rx}px,${ry}px)`; });
    const fm = $("#ftMark");
    on(fm, "pointermove", (e: PointerEvent) => { const r = fm.getBoundingClientRect(); fm.style.setProperty("--fx", `${e.clientX - r.left}px`); fm.style.setProperty("--fy", `${e.clientY - r.top}px`); });
  }

  /* marquee driven by time and scroll speed */
  const rows = $$(".mq-row"), mqX = [0, 0];
  let lastY = scrollY, vel = 0;
  if (!reduced && !PHONE) loop(() => {
    const dy = scrollY - lastY;
    lastY = scrollY;
    vel += (Math.abs(dy) - vel) * 0.1;
    rows.forEach((r, i) => {
      const w = r.scrollWidth / 2, sp = (0.6 + vel * 0.25) * (i ? -1 : 1);
      mqX[i] = (mqX[i] - sp) % w;
      if (mqX[i] > 0) mqX[i] -= w;
      r.style.transform = `translate3d(${mqX[i]}px,0,0)`;
    });
  });

  /* the year cards scroll sideways while the section is pinned (laptop) */
  const pin = $("#yrPin"), rail = $("#yrRail"), yFill = $("#yrFill"), prog = $("#prog"), wm = $(".est-wm"), estSec = $("#estimate");
  const sizePin = () => { pin.style.height = innerWidth > 900 ? `${innerHeight + Math.max(0, rail.scrollWidth - innerWidth)}px` : ""; };
  function maxScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h ? scrollY / h : 0})`;
    if (innerWidth > 900) {
      const r = pin.getBoundingClientRect(), total = pin.offsetHeight - innerHeight;
      const p = total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 0;
      rail.style.transform = `translate3d(${-p * Math.max(0, rail.scrollWidth - innerWidth)}px,0,0)`;
      yFill.style.setProperty("--p", p.toFixed(3));
    }
    wm.style.setProperty("--wy", `${(estSec.getBoundingClientRect().top * -0.18).toFixed(1)}px`);
  }
  sizePin();
  on(window, "resize", sizePin);
  on(window, "load", sizePin);

  /* confetti when the review is booked */
  function confetti() {
    if (reduced) return;
    const cv = $<HTMLCanvasElement>("#conf"), fmEl = $("#fm"), ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, devicePixelRatio || 1), W = fmEl.offsetWidth, H = fmEl.offsetHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const cols = ["#cc8667", "#e2a684", "#14253e", "#f0c4ac", "#8f5538"];
    const P = Array.from({ length: 110 }, (_, i) => ({ x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 11 - 3, r: Math.random() * 6 + 3, c: cols[i % 5], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 }));
    const t0 = performance.now();
    const f = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      P.forEach((p) => { p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
      if (t - t0 < 2600 && !signal.aborted) requestAnimationFrame(f);
      else ctx.clearRect(0, 0, W, H);
    };
    requestAnimationFrame(f);
  }

  /* trust details: only what CT_TRUST holds (real, verified facts) */
  {
    const star = (n: number) => Array.from({ length: 5 }, (_, i) => (i < Math.round(n) ? "★" : "☆")).join("");
    const ht = $("#htr");
    ht.querySelectorAll("[data-trust]").forEach((n) => n.remove());
    if (CT_TRUST.rating) {
      const { score, count, url } = CT_TRUST.rating;
      ht.insertAdjacentHTML("afterbegin", `<li data-trust><span class="stars">${star(Number(score))}</span><span><b>${escHtml(score)}</b> on Google</span></li>`);
      const r = $("#trRate");
      r.innerHTML = `<b>${escHtml(score)}</b><span class="stars">${star(Number(score))}</span><span>from ${count} Google reviews</span>${url ? `<a href="${escHtml(url)}" target="_blank" rel="noopener">Read the reviews</a>` : ""}`;
      r.classList.add("on");
    }
    if (CT_TRUST.since) ht.insertAdjacentHTML("beforeend", `<li data-trust><span>Advising since <b>${CT_TRUST.since}</b></span></li>`);
    if (CT_TRUST.ftaAgent) ht.insertAdjacentHTML("beforeend", "<li data-trust><span>Registered <b>FTA tax agents</b></span></li>");
    if (CT_TRUST.reviews.length) {
      $("#revs").innerHTML = CT_TRUST.reviews.slice(0, 3).map((v) => `<figure class="rv"><span class="stars">★★★★★</span><blockquote>${escHtml(v.quote)}</blockquote><figcaption><b>${escHtml(v.name)}</b><span>${escHtml([v.company, v.type].filter(Boolean).join(", "))}</span></figcaption></figure>`).join("");
      $("#revs").classList.add("on");
      const f = CT_TRUST.reviews[0], bt = $("#bkTrust");
      bt.innerHTML = `<blockquote>${escHtml(f.quote)}</blockquote><figcaption>${escHtml(f.name)}${f.company ? `, ${escHtml(f.company)}` : ""}</figcaption>`;
      bt.classList.add("on");
    }
  }

  /* pause looping animations while their section is off screen */
  const pIO = observe((es) => es.forEach((e) => e.target.classList.toggle("paused", !e.isIntersecting)), { rootMargin: "100px 0px" });
  [".hero", ".mq", "#estimate", "#apply", "#book"].forEach((q) => { const n = root.querySelector(q); if (n) pIO.observe(n); });

  /* ---------- start ---------- */
  renderDial(); estimate(); applies(); late(); onScroll();
  requestAnimationFrame(() => setTimeout(() => dial.classList.add("ready"), reduced ? 0 : 150));
}
