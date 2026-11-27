"use client";

import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { SITE } from "@/content/site";
import { AnCta, AnWhatsApp } from "./AnLinks";
import { useInView, useReducedMotion } from "./motion";
import "./an-s1.css";

/*
  Section 1: the top bar and the hero (designs HeroV4 desktop, HeroV4Phone phone; phone layout below 900px).
  The whole file is a client component because both exports live here; everything is still server-rendered
  in its pre-animation state. Desktop and phone each have their own band (one is display:none), and a band
  only starts once it scrolls into view, so only the visible one plays.
*/

const NAV = [
  ["How it works", "#how"],
  ["Reports", "#reports"],
  ["Reviews", "#reviews"],
  ["Questions", "#questions"],
] as const;

export function AnHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => menu.current?.removeAttribute("open");
  return (
    <header className="s1-head">
      <div className="s1-head-in">
        <span className="s1-logo">
          <span className="s1-mark" aria-hidden="true">b</span>best solution
        </span>
        <nav className="s1-nav" aria-label="Page sections">
          {NAV.map(([label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <a className="s1-tel an-num" href={SITE.phone.href}>{SITE.phone.display}</a>
        <details className="s1-menu" ref={menu}>
          <summary aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav className="s1-menu-panel" aria-label="Menu" onClick={close}>
            {NAV.map(([label, href]) => (
              <a key={href} href={href}>{label}</a>
            ))}
            <a className="s1-menu-tel an-num" href={SITE.phone.href}>{SITE.phone.display}</a>
          </nav>
        </details>
      </div>
    </header>
  );
}

/* ---------- shared pieces ---------- */

const Tick = ({ s = 11, w = 3.4 }: { s?: number; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
);
const Arrow = ({ s }: { s: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);

// The six papers of the month: [class, contents].
const PAPERS: [string, ReactNode][] = [
  ["s1-invoice", <><div className="s1-hd">INVOICE #1042</div><div className="s1-pad"><span>Sales, 2 Sep</span><div className="s1-row s1-mt8"><span>Total</span><b>12,400</b></div></div></>],
  ["s1-statement", <><span className="s1-kind">SUPPLIER BILL</span><div className="s1-row s1-mt6"><span>Paid 5 Sep</span><b>2,150</b></div><div className="s1-bar s1-w80" /><div className="s1-bar s1-w60" /></>],
  ["s1-card", <><div className="s1-row s1-mid"><span className="s1-chip" /><span className="s1-cdate">9 Sep</span></div><div className="s1-row s1-mt14"><span>Card charge, unknown</span><b>1,260</b></div></>],
  ["s1-receipt", <><span className="s1-kind s1-kind-n">RECEIPT</span><div className="s1-mt6">Office supplies</div><div className="s1-row s1-rrow"><span>14 Sep</span><b>380</b></div></>],
  ["s1-statement", <><span className="s1-kind">PAYROLL</span><div className="s1-row s1-mt6"><span>Salaries, 25 Sep</span><b>46,000</b></div><div className="s1-bar s1-w70" /></>],
  ["s1-invoice", <><div className="s1-hd">INVOICE #1043</div><div className="s1-pad"><span>Sales, 28 Sep</span><div className="s1-row s1-mt8"><span>Total</span><b>18,400</b></div></div></>],
];

const ROWS = [
  ["02 Sep", "Sales #1042", "12,400", "", ""],
  ["05 Sep", "Supplier bill", "", "2,150", "paid twice"],
  ["09 Sep", "Card charge", "", "1,260", "check"],
  ["14 Sep", "Office supplies", "", "380", ""],
  ["25 Sep", "Salaries", "", "46,000", ""],
  ["28 Sep", "Sales #1043", "18,400", "", ""],
];

/** The ledger. Rows before `shown` are recorded; `fresh` is the row just recorded (-1 for none). Flags are always laid out and only fade in, so nothing moves. */
function Ledger({ shown, fresh, foot }: { shown: number; fresh: number; foot: boolean }) {
  return (
    <div className="s1-ledger an-num">
      <div className="s1-lrow s1-lhead is-on"><span>DATE</span><span>ITEM</span><span className="s1-r">IN</span><span className="s1-r">OUT</span></div>
      {ROWS.map(([d, item, inn, out, flag], i) => (
        <div key={d} className={`s1-lrow${i < shown ? " is-on" : ""}${i === fresh ? " is-fresh" : ""}`}>
          <span className="s1-ld">{d}</span>
          <span className="s1-li">{item}{flag && <span className="s1-flag">{flag}</span>}</span>
          <span className="s1-r s1-v">{inn}</span>
          <span className="s1-r s1-v">{out}</span>
        </div>
      ))}
      <div className={`s1-lfoot${foot ? " is-on" : ""}`}><span>142 of 142 bank lines matched</span><b>0.00 difference</b></div>
    </div>
  );
}

function Report() {
  return (
    <div className="s1-report">
      <div className="s1-rhead"><span className="s1-rtitle">September, on one page</span><span className="s1-badge">RECONCILED</span></div>
      <div className="an-num">
        <div className="s1-ln"><span>Revenue</span><b>148,200</b></div>
        <div className="s1-ln"><span>Expenses</span><b>(118,670)</b></div>
        <div className="s1-ln s1-lnet"><span>Net profit</span><span className="s1-net">29,530</span></div>
      </div>
      <div className="s1-advice"><b>Advisor note.</b> The supplier bill was paid twice (2,150). Ask for it back this week.</div>
      <AnCta section={1} className="s1-mini">Get this for my business <Arrow s={15} /></AnCta>
    </div>
  );
}

type Timers = { at: (ms: number, fn: () => void) => void; clear: () => void };

/** A stable set of timeouts that is cleared on unmount. */
function useTimers(): Timers {
  const [t] = useState<Timers>(() => {
    const ids: number[] = [];
    return {
      at: (ms, fn) => void ids.push(window.setTimeout(fn, ms)),
      clear: () => ids.splice(0).forEach(clearTimeout),
    };
  });
  useEffect(() => t.clear, [t]);
  return t;
}

/* ---------- desktop band: papers fly into a stack, ledger fills, report appears ---------- */

type Desk = { n: number; done: boolean };
const DESK_END: Desk = { n: 6, done: true };
// Scattered positions [x, y, rotate] before each paper is recorded.
const DESK_POS = [[0, 6, -6], [186, 34, 5], [170, 140, -7], [6, 128, 7], [186, 250, -4], [0, 262, 5]];

/** How long the finished month stays on screen before the loop starts again. */
const HOLD_MS = 4000;
/** Lets the papers fly back to the pile before the next run starts. */
const RESTART_MS = 900;

/* Plays the month, holds the finished page, then starts again, for as long as the band stays on screen. */
function loopDesk(t: Timers, set: (d: Desk) => void, delay: number, onDone: () => void) {
  t.clear();
  set({ n: 0, done: false });
  for (let i = 1; i <= 6; i++) t.at(delay + i * 520, () => set({ n: i, done: false }));
  t.at(delay + 7 * 520, () => {
    set(DESK_END);
    onDone();
  });
  t.at(delay + 7 * 520 + HOLD_MS, () => loopDesk(t, set, RESTART_MS, onDone));
}

/* ---------- phone band: one stage at a time, 1 · 2 · 3 buttons ---------- */

type Ph = { ph: number; n: number; m: number; busy: boolean };
const PH_START: Ph = { ph: 0, n: 0, m: 0, busy: true };
const PH_END: Ph = { ph: 2, n: 6, m: 6, busy: false };
const PH_POS = [[0, 6, -6], [178, 30, 5], [172, 136, -7], [4, 120, 7], [178, 240, -4], [0, 250, 5]];
const STEPS = ["1 · Your month", "2 · We record it", "3 · One page"];
const CAPTIONS = ["Your month, as it arrives", "Every line recorded and matched", "September, on one page"];

function loopPhone(t: Timers, set: Dispatch<SetStateAction<Ph>>, start = 1100) {
  t.clear();
  set(PH_START);
  let ms = start;
  for (let i = 1; i <= 6; i++, ms += 380) t.at(ms, () => set((s) => ({ ...s, n: i })));
  ms += 500;
  t.at(ms, () => set((s) => ({ ...s, ph: 1 })));
  ms += 350;
  for (let i = 1; i <= 6; i++, ms += 300) t.at(ms, () => set((s) => ({ ...s, m: i })));
  ms += 1300;
  t.at(ms, () => set(PH_END));
  t.at(ms + HOLD_MS, () => loopPhone(t, set, RESTART_MS));
}

function PhoneBand({ reduced }: { reduced: boolean }) {
  const [ref, seen, visible] = useInView<HTMLDivElement>(0.3);
  const [state, setS] = useState<Ph>(PH_START);
  // Once the visitor taps 1, 2 or 3 they are in control: the loop stops for good.
  const [manual, setManual] = useState(false);
  const t = useTimers();
  // Reduced motion: show the final stage until the visitor picks a stage themselves.
  const s = reduced && state.busy ? PH_END : state;
  useEffect(() => {
    if (reduced || manual || !seen || !visible) return t.clear();
    loopPhone(t, setS);
    return t.clear;
  }, [seen, visible, reduced, manual, t]);

  const jump = (ph: number) => {
    setManual(true);
    t.clear();
    setS({ ph, n: 6, m: 6, busy: false });
  };
  const layer = (k: number) => (k === s.ph ? "is-on" : k < s.ph ? "is-past" : "");
  const prog = [s.n / 6, s.m / 6, s.ph === 2 ? 1 : 0];

  return (
    <div className="s1-band s1-phone" ref={ref}>
      <div className="s1-steps">
        {STEPS.map((label, k) => (
          <button key={k} type="button" className={`s1-step ${layer(k)}`} aria-pressed={k === s.ph} onClick={() => jump(k)}>
            <span className="s1-sl">{label}</span>
            <span className="s1-sb"><span style={{ transform: `scaleX(${k < s.ph ? 1 : k === s.ph ? Math.max(prog[k], 0.08) : 0})` }} /></span>
          </button>
        ))}
      </div>
      <span className="s1-cap">{CAPTIONS[s.ph]}</span>
      <div className="s1-pstage">
        <div className={`s1-layer s1-layer0 ${layer(0)}`} aria-hidden="true">
          {PAPERS.map(([cls, body], i) => {
            const [x, y, r] = PH_POS[i];
            const got = i < s.n;
            return (
              <div key={i} className={`s1-obj ${cls} an-num`} style={{ transform: `translate(${x}px,${y}px) rotate(${got ? 0 : r}deg)`, zIndex: 10 - i }}>
                {body}
                <span className={`s1-chk${got ? " is-on" : ""}`}><Tick /></span>
              </div>
            );
          })}
        </div>
        <div className={`s1-layer ${layer(1)}`} aria-hidden="true">
          <Ledger shown={s.m} fresh={s.busy ? s.m - 1 : -1} foot={s.m >= 6} />
        </div>
        <div className={`s1-layer ${layer(2)}`}>
          <Report />
        </div>
      </div>
      <p className="s1-foot">Best Solution is a private consultancy, not the Federal Tax Authority. Figures are examples only.</p>
    </div>
  );
}

/* ---------- the hero ---------- */

export function AnHero() {
  const reduced = useReducedMotion();
  const [deskRef, deskSeen, deskVisible] = useInView<HTMLDivElement>(0.3);
  const [state, setD] = useState<Desk>({ n: 0, done: false });
  // The answer line under the h1 appears after the first run and then stays, rather than blinking each loop.
  const [answered, setAnswered] = useState(false);
  const t = useTimers();
  // Reduced motion: always the final state, no movement.
  const d = reduced ? DESK_END : state;
  // Loops only while the band is on screen; scrolling back to it starts a fresh run.
  useEffect(() => {
    if (reduced || !deskSeen || !deskVisible) return t.clear();
    loopDesk(t, setD, 600, () => setAnswered(true));
    return t.clear;
  }, [deskSeen, deskVisible, reduced, t]);

  return (
    <section className="s1" aria-labelledby="s1-title">
      <div className="s1-top">
        <div className="s1-left">
          <span className="s1-eyebrow">
            <span className="s1-dash" aria-hidden="true" />
            <span className="s1-d">Accounting and bookkeeping · Business Bay, Dubai</span>
            <span className="s1-p">Accounting · Business Bay, Dubai</span>
          </span>
          <h1 id="s1-title" className="an-h s1-h">
            Do you know what your<br className="s1-d" /> business <b>made <span className="s1-cu">last month?</span></b>
          </h1>
          <p className={`s1-answer an-num${reduced || answered ? " is-on" : ""}`}>
            <span className="s1-al">In this example, the answer is</span>
            <span className="s1-net">29,530</span>
            <span className="s1-al">net profit. Do you know yours?</span>
          </p>
        </div>
        <div className="s1-right">
          <p className="s1-lede">
            {"Your bank balance won't tell you. Our qualified accountants keep your books, file your VAT and Corporate Tax returns, and send you a one-page report every month."}
          </p>
          <div className="s1-ctas">
            <AnCta section={1} className="an-btn1 s1-btn1">
              Get my quote today <span className="s1-arr" aria-hidden="true"><Arrow s={16} /></span>
            </AnCta>
            <AnWhatsApp section={1} className="an-btn2 s1-btn2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F8F4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6L3 21z" /></svg>
              <span className="s1-d">WhatsApp</span>
              <span className="s1-p">WhatsApp an accountant</span>
            </AnWhatsApp>
          </div>
          <span className="s1-small">Quote the same working day · Mon to Fri · No obligation</span>
        </div>
      </div>

      <div className="s1-band s1-desk" ref={deskRef}>
        <div className="s1-stage">
          <div className="s1-labels">
            <span className="s1-stg"><span className="s1-stn">1</span>Your month, as it arrives</span>
            <span className="s1-stg"><span className="s1-stn">2</span>Our accountants record it · <span className="an-num s1-count">{d.n} of 6</span></span>
            <span className="s1-stg"><span className="s1-stn">3</span>You get one page</span>
          </div>
          <div className="s1-rule" />
          <div className="s1-papers" aria-hidden="true">
            <div className={`s1-note${d.done ? " is-on" : ""}`}>
              <span className="s1-notechk"><Tick s={13} w={3.2} /></span>
              <span><b>6 papers, all recorded.</b><br />Filed for you.</span>
            </div>
            {PAPERS.map(([cls, body], i) => {
              const [x, y, r] = DESK_POS[i];
              const got = i < d.n;
              return (
                <div
                  key={i}
                  className={`s1-obj ${cls} an-num`}
                  style={{
                    transform: got ? `translate(${84 + i * 5}px,${96 + i * 8}px) rotate(${i % 2 ? 1.5 : -1.5}deg)` : `translate(${x}px,${y}px) rotate(${r}deg)`,
                    zIndex: got ? 20 + i : 10 - i,
                    transitionDelay: got ? "150ms" : "0ms",
                  }}
                >
                  {body}
                  <span className={`s1-chk${got && !d.done ? " is-on" : ""}`}><Tick /></span>
                </div>
              );
            })}
          </div>
          <div className="s1-dledger" aria-hidden="true">
            <Ledger shown={d.n} fresh={d.done ? -1 : d.n - 1} foot={d.done} />
          </div>
          <div className="s1-dright">
            <div className="s1-swap">
              <div className={`s1-wait${d.done ? "" : " is-on"}`} aria-hidden="true">
                <span className="s1-wait-t">Your one-page report</span>
                <span>appears here when the month is recorded</span>
              </div>
              <div className={`s1-rep${d.done ? " is-on" : ""}`}>
                <Report />
              </div>
            </div>
          </div>
          <p className="s1-foot">Best Solution is a private consultancy, not the Federal Tax Authority. Example Trading LLC. Figures are examples only.</p>
        </div>
      </div>

      <PhoneBand reduced={reduced} />
    </section>
  );
}
