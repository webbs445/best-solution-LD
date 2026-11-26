"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useInView, useReducedMotion } from "./motion";
import "./an-s5.css";

/* S5 "You send. We sort. You read.": the monthly flow, with an example pack whose tabs cycle on their own until the visitor takes over. */

const SEND = [
  { label: "Sales invoices", icon: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></> },
  { label: "Supplier bills", icon: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M9 13h6M9 17h4" /></> },
  { label: "Bank and card statements", icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></> },
  { label: "Receipts", icon: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></> },
  { label: "Payroll", icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .8 3.5 2.8 3.5 6" /></> },
];

const SORT = ["Every invoice and bill recorded", "Every bank line matched", "Anything odd flagged for you", "VAT and Corporate Tax kept ready"];

const PACK = [
  { label: "Profit and loss", q: "Did you make money this month?", rows: [["Revenue", "148,200"], ["Expenses", "(118,670)"], ["Net profit", "29,530"]], src: 0, mid: 0 },
  { label: "Bank reconciliation", q: "Every bank payment matched to a record.", rows: [["Bank lines matched", "142 of 142"], ["Closing difference", "0.00"]], src: 2, mid: 1 },
  { label: "Balance sheet", q: "What the company owns and owes.", rows: [["Cash and money owed to you", "276,940"], ["Owed to suppliers and VAT", "(49,190)"], ["Net assets", "227,750"]], src: 1, mid: 3 },
  { label: "Cash flow", q: "Where the cash came from and where it went.", rows: [["Opening", "186,910"], ["Cash in", "139,600"], ["Cash out", "(113,870)"], ["Closing", "212,640"]], src: 4, mid: 0 },
  {
    label: "Advisor notes",
    q: "What needs your attention.",
    rows: [],
    note: "A supplier was paid twice (2,150). Ask for it back. Two invoices are unpaid for over 60 days (18,400 and 22,600). Worth a call this week.",
    src: 3,
    mid: 2,
  },
];

const KEYS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function Icon({ children, size = 15, sw = 2 }: { children: React.ReactNode; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function AnFlow() {
  const [ref, seen, visible] = useInView<HTMLElement>(0.3);
  const reduced = useReducedMotion();
  const [k, setK] = useState(0);
  const [stopped, setStopped] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const cur = PACK[k];

  // Auto cycle: only once seen, paused off screen, never after the visitor takes over or with reduced motion.
  useEffect(() => {
    if (!seen || !visible || stopped || reduced) return;
    const t = setInterval(() => setK((x) => (x + 1) % PACK.length), 2800);
    return () => clearInterval(t);
  }, [seen, visible, stopped, reduced]);

  // Phone: the tab strip scrolls sideways, so keep the chosen tab in view without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.children[k] as HTMLElement | undefined;
    if (list && tab && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
    }
  }, [k, reduced]);

  const pick = (i: number) => {
    setStopped(true);
    setK(i);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = PACK.length;
    const j = e.key in KEYS ? (i + KEYS[e.key] + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    pick(j);
    (listRef.current?.children[j] as HTMLElement | undefined)?.focus();
  };

  const packet = (cls: string) => (seen && !reduced ? <span key={k} className={cls} /> : null);

  return (
    <section id="reports" className="s5" ref={ref} aria-labelledby="s5-h">
      <div className="an-wrap s5-in">
        <div className="s5-head">
          <div className="s5-ttl">
            <span className="s5-eye">Every month</span>
            <h2 id="s5-h" className="an-h">
              You send. We sort. <b className="s5-nw">You read.</b>
            </h2>
          </div>
          <p className="s5-lead">Email, a shared folder or access to your software. Whatever is easier for you.</p>
        </div>

        <div className="s5-flow">
          <div className="s5-pan s5-send">
            <div className="s5-ph">
              <span className="s5-pn">1</span>
              <span className="s5-pt">You send</span>
            </div>
            <div className="s5-its">
              {SEND.map((s, i) => (
                <div key={s.label} className={i === cur.src ? "s5-it on" : "s5-it"}>
                  <span className="s5-ic">
                    <Icon>{s.icon}</Icon>
                  </span>
                  {s.label}
                  <span className="s5-tagk" aria-hidden="true">
                    SENT
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="s5-wire s5-w1" aria-hidden="true">
            {packet("s5-pk")}
          </div>

          <div className="s5-pan s5-sort">
            <div className="s5-ph">
              <span className="s5-pn">2</span>
              <span className="s5-pt">We sort</span>
            </div>
            <div className="s5-sls">
              {SORT.map((t, i) => (
                <div key={t} className={i === cur.mid ? "s5-sl on" : "s5-sl"}>
                  <span className="s5-d">
                    <Icon size={10} sw={3.6}>
                      <path d="m5 12 5 5 9-10" />
                    </Icon>
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <span className="s5-sw">Zoho Books, QuickBooks, Tally, or ours</span>
          </div>

          <div className="s5-wire s5-w2" aria-hidden="true">
            {packet("s5-pk s5-pk2")}
          </div>

          <div className="s5-pan s5-read">
            <div className="s5-ph">
              <span className="s5-pn">3</span>
              <span className="s5-pt">You read</span>
              <span className="s5-ex">Example pack</span>
            </div>
            <div className="s5-binder an-num">
              <div className="s5-tabs" role="tablist" aria-label="Your monthly pack" ref={listRef}>
                {PACK.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    role="tab"
                    id={`s5-tab-${i}`}
                    aria-selected={i === k}
                    aria-controls={`s5-panel-${i}`}
                    tabIndex={i === k ? 0 : -1}
                    className={i === k ? "s5-tab on" : "s5-tab"}
                    onClick={() => pick(i)}
                    onMouseEnter={() => pick(i)}
                    onFocus={() => setStopped(true)}
                    onKeyDown={(e) => onKey(e, i)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="s5-page">
                {PACK.map((p, i) => (
                  <div
                    key={p.label}
                    role="tabpanel"
                    id={`s5-panel-${i}`}
                    aria-labelledby={`s5-tab-${i}`}
                    tabIndex={0}
                    className={i === k ? "s5-panel on" : "s5-panel"}
                  >
                    <span className="s5-pq">{p.q}</span>
                    {p.rows.map(([a, b]) => (
                      <div key={a} className="s5-ln">
                        <span>{a}</span>
                        <b>{b}</b>
                      </div>
                    ))}
                    {p.note && <span className="s5-note">{p.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="s5-quote">
          <span className="s5-qm" aria-hidden="true">
            “
          </span>
          <span className="s5-qt">
            We found a supplier paid twice and two invoices over 60 days. <b>That&apos;s what a spreadsheet won&apos;t tell you.</b>
          </span>
        </div>
      </div>
    </section>
  );
}
