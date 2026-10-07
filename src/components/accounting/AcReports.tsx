"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

type Tab = "pl" | "rc" | "bs";

const NAV: { r: Tab; title: string; note: string; icon: ReactNode }[] = [
  { r: "pl", title: "Profit and Loss", note: "What you earned, spent and kept this month.", icon: <path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6" /> },
  {
    r: "rc",
    title: "Bank reconciliation",
    note: "Every bank line matched. Unmatched items listed with a next step.",
    icon: <path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18" />,
  },
  {
    r: "bs",
    title: "Balance Sheet and Cash Flow",
    note: "Your position for banks, partners and auditors.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 10v10" />
      </>
    ),
  },
];
const TABS: { r: Tab; label: string }[] = [
  { r: "pl", label: "P&L" },
  { r: "rc", label: "Reconciliation" },
  { r: "bs", label: "Position" },
];

/* Sample chart: six months of revenue and expenses (AED thousands). */
const W = 520;
const H = 150;
const REV = [118, 126, 121, 134, 131, 148.2];
const EXP = [101, 107, 104, 113, 112, 118.7];
const LO = 90;
const HI = 155;
const pts = (a: number[]) => a.map((v, i) => [i * (W / 5), H - ((v - LO) / (HI - LO)) * H] as const);
const line = (p: readonly (readonly [number, number])[]) => p.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
const PR = pts(REV);
const PE = pts(EXP);

/* Auto-switch: the next tab after each one. The first loop shows each tab for 3 s, every later loop for 6 s. */
const NEXT: Record<Tab, Tab> = { pl: "rc", rc: "bs", bs: "pl" };
const FIRST_LOOP_MS = 3000;
const LOOP_MS = 6000;

/*
  "Reports you'll actually read": a sample monthly pack with three tabs; each switch replays its animation.
  While the section is on screen (and the pointer is not over it) the tabs loop by themselves, with a
  progress bar on the active button: 3 s per tab on the first loop, then 6 s per tab. A click shows that
  tab and the loop carries on from it with a fresh timer. Only clicks are reported as report_tab;
  reduced motion turns the auto-switch off.
*/
export function AcReports() {
  const [tab, setTab] = useState<Tab>("pl");
  const [replay, setReplay] = useState(0);
  const [shown, setShown] = useState(0); // tabs shown by the loop so far; the first 3 are the quick first loop
  const [inView, setInView] = useState(false);
  const [hover, setHover] = useState(false);
  const section = useRef<HTMLElement>(null);
  const running = inView && !hover;
  const delay = shown < 3 ? FIRST_LOOP_MS : LOOP_MS;
  const tabsRef = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const chart = useRef<HTMLDivElement>(null);
  const pinDot = useRef<HTMLSpanElement>(null);
  const paper = useRef<HTMLDivElement>(null);

  // Pause while a mouse pointer rests on the section (desktop only: a tap on a phone also fires mouseenter
  // but often no mouseleave, which would pause the loop for good).
  const pauseOnHover = () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) setHover(true);
  };

  const show = (r: Tab, user: boolean) => {
    setTab(r);
    setReplay((n) => n + 1);
    if (user) trackEvent("report_tab", { tab: r });
  };

  // Auto-switch only while the section crosses the middle band of the screen (works for any section height,
  // including the tall stacked layout on small phones).
  useEffect(() => {
    const s = section.current;
    if (!s || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "-30% 0px -30% 0px" });
    io.observe(s);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running || prefersReducedMotion()) return;
    const t = window.setTimeout(() => {
      setTab((cur) => NEXT[cur]);
      setReplay((n) => n + 1);
      setShown((n) => n + 1);
    }, delay);
    return () => window.clearTimeout(t);
  }, [running, tab, replay, delay]);

  // Underline follows the active tab; the chart's end-point marker sits on the last revenue point.
  useLayoutEffect(() => {
    const place = () => {
      const a = tabsRef.current?.querySelector<HTMLElement>("span.on");
      if (a && ink.current) {
        ink.current.style.left = `${a.offsetLeft}px`;
        ink.current.style.width = `${a.offsetWidth}px`;
      }
      const s = svg.current;
      const c = chart.current;
      const d = pinDot.current;
      if (s && c && d) {
        const r = s.getBoundingClientRect();
        const b = c.getBoundingClientRect();
        d.style.left = `${r.left - b.left + r.width}px`;
        d.style.top = `${r.top - b.top + (PR[5][1] / H) * r.height}px`;
      }
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [tab, replay]);

  // Replay the chart draw when the report first scrolls into view.
  useEffect(() => {
    const p = paper.current;
    if (!p || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setTab("pl");
        setReplay((n) => n + 1);
      },
      { threshold: 0.35 },
    );
    io.observe(p);
    return () => io.disconnect();
  }, []);

  const pane = (r: Tab, children: ReactNode) => (
    <div className={`rp-pane${tab === r ? " on" : ""}`} data-p={r} key={tab === r ? `${r}-${replay}` : r}>
      {children}
    </div>
  );

  return (
    <section className="sheet s-white light-zone" id="reports" ref={section} onMouseEnter={pauseOnHover} onMouseLeave={() => setHover(false)}>
      <div className="wrap rp">
        <div className="rp-intro rv">
          <span className="kicker">What you receive</span>
          <h2 style={{ marginTop: 16 }}>Reports you&apos;ll actually read.</h2>
          <p className="lede">Each month you get a short report pack and a review call. Pick a page to preview what lands in your inbox.</p>
          <div className="rp-nav" role="tablist" aria-label="Report pages">
            {NAV.map((n) => (
              <button key={n.r} type="button" role="tab" aria-selected={tab === n.r} data-r={n.r} onClick={() => show(n.r, true)}>
                <i>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {n.icon}
                  </svg>
                </i>
                <div>
                  <b>{n.title}</b>
                  <small>{n.note}</small>
                </div>
                <span className="ar">→</span>
                {running && tab === n.r && (
                  <span className="rp-auto" key={`${tab}-${replay}`} style={{ animationDuration: `${delay}ms` }} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
          <p className="rp-call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
            </svg>
            Every pack comes with a short call to walk you through it.
          </p>
        </div>

        <div className="rp-doc rv d1" aria-label="Sample monthly report">
          <div className="rp-paper" ref={paper}>
            <header className="rp-head">
              <div>
                <span className="rp-eyebrow">Monthly management report</span>
                <b>Example Trading LLC</b>
                <small>September 2026 · AED</small>
              </div>
              <span className="rp-tag">Sample</span>
            </header>
            <div className="rp-tabs" ref={tabsRef}>
              {TABS.map((t) => (
                <span key={t.r} data-r={t.r} className={tab === t.r ? "on" : undefined} style={{ cursor: "pointer" }} onClick={() => show(t.r, true)}>
                  {t.label}
                </span>
              ))}
              <i id="rpInk" ref={ink} />
            </div>

            {pane(
              "pl",
              <>
                <div className="rp-kpis">
                  <div>
                    <small>Revenue</small>
                    <b data-n="148200">148,200</b>
                    <em className="up">▲ 13% vs Aug</em>
                  </div>
                  <div>
                    <small>Expenses</small>
                    <b data-n="118670">118,670</b>
                    <em className="mid">▲ 6% vs Aug</em>
                  </div>
                  <div className="hl">
                    <small>Net profit</small>
                    <b data-n="29530">29,530</b>
                    <em className="up">19.9% margin</em>
                  </div>
                </div>
                <div className="rp-chart" ref={chart} style={{ position: "relative" }}>
                  <div className="rp-legend">
                    <span>
                      <i className="lr" />
                      Revenue
                    </span>
                    <span>
                      <i className="le" />
                      Expenses
                    </span>
                    <small>Last 6 months, AED k</small>
                  </div>
                  <svg viewBox="0 0 520 170" preserveAspectRatio="none" id="rpSvg" ref={svg} aria-hidden="true">
                    <defs>
                      <linearGradient id="rpFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#cc8667" stopOpacity=".22" />
                        <stop offset="1" stopColor="#cc8667" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((i) => (
                      <line key={i} className="gl" x1="0" x2={W} y1={(H / 3) * i} y2={(H / 3) * i} />
                    ))}
                    <path className="ar" d={`${line(PR)} L${W} ${H} L0 ${H}Z`} />
                    <path className="le" d={line(PE)} />
                    <path className="lr" d={line(PR)} />
                  </svg>
                  <span className="rp-pin" ref={pinDot}>
                    <i />
                    <em>AED 148.2k</em>
                  </span>
                  <div className="rp-mo">
                    {["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
                <div className="rp-note">
                  <b>Advisor note</b>Revenue grew 13% on August. Costs rose more slowly, so margin moved up to about 20%.
                </div>
              </>,
            )}

            {pane(
              "rc",
              <>
                <div className="rp-match">
                  <div className="rp-mt">
                    <b>
                      <span data-n="142">142</span> of 145
                    </b>
                    <small>bank lines matched to your records</small>
                  </div>
                  <div className="rp-bar">
                    <i style={{ "--w": "97.9%" } as CSSProperties} />
                  </div>
                  <div className="rp-acc">
                    <span>Main current account</span>
                    <span>
                      Closing difference <b>AED 0.00</b>
                    </span>
                  </div>
                </div>
                <div className="rp-open">
                  <div className="rp-oh">
                    <span>Unmatched items</span>
                    <span>Next step</span>
                  </div>
                  {[
                    ["Card payment, supplier not named", "14 Sep · AED 1,260", "c1", "Send receipt"],
                    ["Customer deposit without an invoice", "22 Sep · AED 8,400", "c2", "Confirm invoice"],
                    ["Supplier paid twice", "27 Sep · AED 2,150", "c3", "Request refund"],
                  ].map(([t, s, c, chip]) => (
                    <div className="rp-row" key={t}>
                      <div>
                        <b>{t}</b>
                        <small>{s}</small>
                      </div>
                      <span className={`chip ${c}`}>{chip}</span>
                    </div>
                  ))}
                </div>
                <div className="rp-note">
                  <b>Advisor note</b>One duplicate payment found. Recovering it adds AED 2,150 back to cash.
                </div>
              </>,
            )}

            {pane(
              "bs",
              <>
                <div className="rp-two">
                  <div className="rp-pos">
                    <span className="rp-sub">Position at 30 Sep</span>
                    {[
                      ["Cash at bank", "212,640"],
                      ["Receivables", "64,300"],
                      ["Payables and VAT", "(49,190)"],
                    ].map(([k, v]) => (
                      <div className="ln" key={k}>
                        <span>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                    <div className="ln tot">
                      <span>Net assets</span>
                      <span>227,750</span>
                    </div>
                  </div>
                  <div className="rp-wf">
                    <span className="rp-sub">Cash movement in September</span>
                    {[
                      ["Opening", "b-base", "0%", "57.2%", "186,910", ""],
                      ["Cash in", "b-in", "57.2%", "42.8%", "+139,600", "pos"],
                      ["Cash out", "b-out", "65.1%", "34.9%", "−113,870", "neg"],
                      ["Closing", "b-end", "0%", "65.1%", "212,640", ""],
                    ].map(([k, cls, l, w, v, tone]) => (
                      <div className="wf" key={k}>
                        <span>{k}</span>
                        <div className="tr">
                          <i className={cls} style={{ "--l": l, "--w": w } as CSSProperties} />
                        </div>
                        <b className={tone || undefined}>{v}</b>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rp-note">
                  <b>Advisor note</b>Cash rose by AED 25,730. Two invoices over 60 days make up AED 18,400 of receivables, so a follow-up is
                  suggested.
                </div>
              </>,
            )}

            <p className="rp-cap">Example figures for illustration only. Your pack uses your own accounts.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
