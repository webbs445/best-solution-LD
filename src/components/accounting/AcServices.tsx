"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { AC_CLAIMS, aed } from "@/content/accounting";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-6" />
  </svg>
);
const ARROW = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
);
const icon = (body: ReactNode) => (
  <span className="sc-ic">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {body}
    </svg>
  </span>
);

interface Card {
  tone: string;
  wm: string;
  icon: ReactNode;
  title: string;
  desc?: string;
  tag?: string;
  price?: { small: string; b: string; span: string };
  items?: string[];
  extras?: { b: string; p: string }[];
  /** Small line under the extras list. */
  note?: string;
  foot: { b: string; t: string };
  cta: { label: string; href: string; service?: string; className: string; location: string };
}

const CARDS: Card[] = [
  {
    tone: "c-light",
    wm: "01",
    icon: (
      <>
        <path d="M4 4h12l4 4v12H4z" />
        <path d="M8 10h8M8 14h8M8 18h5" />
      </>
    ),
    title: "Bookkeeping",
    desc: "Every sale, purchase and expense recorded, so your ledger is always current.",
    price: { small: "From", b: aed(AC_CLAIMS.prices.bookkeeping), span: "per month" },
    items: ["Sales and purchases recorded", "Expense and income tracking", "Daily, weekly or monthly entry", "Monthly income and cost summary"],
    foot: { b: "Fixed monthly fee", t: "confirmed in writing" },
    cta: { label: "Get a quote", href: "#contact", service: "bookkeeping", className: "btn btn-navy", location: "AC Services — Bookkeeping" },
  },
  {
    tone: "c-navy",
    wm: "02",
    icon: <path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18" />,
    title: "Bank reconciliation",
    desc: "Every bank line matched to your books, so nothing slips through.",
    price: { small: "From", b: aed(AC_CLAIMS.prices.reconciliation), span: "per reconciliation" },
    items: ["Every transaction matched", "Discrepancies flagged with notes", "Missing entries and fees traced", "Multiple bank accounts"],
    foot: { b: "Every bank account", t: "matched line by line" },
    cta: { label: "Get a quote", href: "#contact", service: "reconciliation", className: "btn btn-copper", location: "AC Services — Bank reconciliation" },
  },
  {
    tone: "c-tint",
    wm: "03",
    icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    title: "Financial statements",
    desc: "Clear reports you can hand to a bank, an auditor or a partner.",
    price: { small: "From", b: aed(AC_CLAIMS.prices.statements), span: "per set" },
    items: ["Profit and Loss statement", "Balance Sheet", "Cash Flow statement", "Monthly or periodic reporting"],
    foot: { b: "Monthly or year-end", t: "for banks and auditors" },
    cta: { label: "Get a quote", href: "#contact", service: "statements", className: "btn btn-navy", location: "AC Services — Financial statements" },
  },
  {
    tone: "c-copper",
    wm: "04",
    icon: (
      <>
        <path d="M12 3l9 5-9 5-9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
    title: "Complete package",
    tag: `Save about ${AC_CLAIMS.packageSaving}%`,
    desc: "All three as one monthly service, with one point of contact.",
    price: { small: "Package saving", b: `About ${AC_CLAIMS.packageSaving}%`, span: "vs. taking them separately" },
    items: ["Bookkeeping, reconciliation, statements", "Monthly reports", "Audit-ready records", "One point of contact"],
    foot: { b: "Fixed monthly fee", t: "priced on your volume" },
    cta: { label: "Quote the package", href: "#contact", service: "complete", className: "btn", location: "AC Services — Complete package" },
  },
  {
    tone: "c-ground",
    wm: "+",
    icon: <path d="M12 5v14M5 12h14" />,
    title: "Also available",
    extras: [
      { b: "VAT-ready books", p: "Figures your VAT returns rely on, prepared and reviewed with you." },
      { b: "Corporate tax readiness", p: "Books organised so year-end is a review, not a scramble." },
      { b: "Catch-up bookkeeping", p: "Missing months rebuilt first, then a monthly routine." },
    ],
    note: "We prepare and review the figures. Tax decisions stay with the Federal Tax Authority.",
    foot: { b: "Not sure what fits?", t: "An accountant will advise" },
    cta: { label: "Take the check", href: "#check", className: "btn btn-navy", location: "AC Services — Take the check" },
  },
];

/*
  Services and pricing: the section pins while the cards slide sideways as you scroll, on every screen size
  (the row is scaled to fit the screen height). Each card is reported once as service_card_view, only while the section is on screen.
*/
export function AcServices() {
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const [act, setAct] = useState(0);
  const lastAct = useRef(-1);

  useEffect(() => {
    const p = pin.current;
    const t = track.current;
    const st = sticky.current;
    const sh = head.current;
    if (!p || !t || !st || !sh) return;
    let fitS = 1;
    const cards = () => [...t.querySelectorAll<HTMLElement>(".sc")];
    // service_card_view: only while the section is on screen, and each card at most once per page view.
    let inView = false;
    const reported = new Set<number>();
    const report = (i: number) => {
      if (!inView || reported.has(i)) return;
      reported.add(i);
      trackEvent("service_card_view", { card: i + 1 });
    };
    const activate = (i: number) => {
      if (i === lastAct.current) return;
      lastAct.current = i;
      setAct(i);
      report(i);
    };
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([e]) => {
              inView = e.isIntersecting;
              if (inView) report(Math.max(0, lastAct.current));
            },
            { threshold: 0.5 },
          )
        : null;
    io?.observe(st);
    // Scale the card row so it fits the screen height under the heading (phones included).
    const fit = () => {
      const cs = getComputedStyle(st);
      const hm = parseFloat(getComputedStyle(sh).marginBottom) || 0;
      const avail = window.innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - sh.offsetHeight - hm - 8;
      const h = t.offsetHeight;
      fitS = Math.max(0.62, Math.min(1, avail / h));
      t.style.marginBottom = `${-(h * (1 - fitS))}px`;
    };
    const update = () => {
      const list = cards();
      const r = p.getBoundingClientRect();
      const total = p.offsetHeight - window.innerHeight;
      const prog = Math.max(0, Math.min(1, -r.top / total));
      const first = list[0];
      const last = list[list.length - 1];
      let x: number;
      if (window.innerWidth <= 900) {
        // Phones and tablets: glide from the first card's centre to the last one's, so the active card sits mid-screen.
        const c0 = first.offsetLeft + first.offsetWidth / 2;
        const c1 = last.offsetLeft + last.offsetWidth / 2;
        x = window.innerWidth / 2 - (c0 + prog * (c1 - c0)) * fitS;
        t.style.transformOrigin = "left top";
      } else {
        // Desktop: scale around the first card's left edge, so it lines up with the heading at any scale.
        const ts = getComputedStyle(t);
        const padL = parseFloat(ts.paddingLeft) || 24;
        const padR = parseFloat(ts.paddingRight) || 24;
        x = -prog * Math.max(0, padL + (last.offsetLeft + last.offsetWidth + padR - padL) * fitS - window.innerWidth);
        t.style.transformOrigin = `${padL}px top`;
      }
      t.style.transform = `translate3d(${x}px,0,0) scale(${fitS})`;
      if (bar.current) bar.current.style.width = `${prog * 100}%`;
      if (hint.current) hint.current.style.opacity = prog > 0.92 ? "0" : "1";
      activate(Math.min(list.length - 1, Math.round(prog * (list.length - 1))));
    };
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          update();
        });
      }
    };
    const onResize = () => {
      fit();
      update();
    };
    fit();
    update();
    document.fonts?.ready.then(onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="sheet s-ground light-zone" id="services">
      <div className="pin" id="pin" ref={pin}>
        <div className="pin-sticky" ref={sticky}>
          <div className="wrap svc-head" ref={head}>
            <div>
              <span className="kicker">Services and pricing</span>
              <h2>Pick one, or let us run it all.</h2>
              <p className="lede">Every price is a from-price, confirmed in writing before any work begins.</p>
            </div>
            <div className="meter-box">
              <div className="counter">
                <b id="sNow">{String(act + 1).padStart(2, "0")}</b>/ 05
              </div>
              <div className="sbar">
                <i id="sBar" ref={bar} />
              </div>
              <p className="svc-note">Prices exclude VAT. Final fee depends on your volume.</p>
              <span className="hint" id="sHint" ref={hint}>
                Keep scrolling {ARROW}
              </span>
            </div>
          </div>

          <div className="track" id="track" ref={track}>
            {CARDS.map((c, i) => (
              <article key={c.title} className={`sc ${c.tone}${act === i ? " act" : ""}`}>
                <span className="wm">{c.wm}</span>
                <div className="sc-top">
                  {icon(c.icon)}
                  {c.tag && <span className="tag">{c.tag}</span>}
                  <span className="sc-no">{String(i + 1).padStart(2, "0")} / 05</span>
                </div>
                <h3>{c.title}</h3>
                {c.desc && <p className="d">{c.desc}</p>}
                {c.price && (
                  <div className="pr">
                    <small>{c.price.small}</small>
                    <b>{c.price.b}</b>
                    <span>{c.price.span}</span>
                  </div>
                )}
                {c.items && (
                  <ul>
                    {c.items.map((it) => (
                      <li key={it}>
                        {CHECK}
                        {it}
                      </li>
                    ))}
                  </ul>
                )}
                {c.extras && (
                  <div className="ex-list">
                    {c.extras.map((x) => (
                      <div key={x.b}>
                        <b>{x.b}</b>
                        <p>{x.p}</p>
                      </div>
                    ))}
                  </div>
                )}
                {c.note && <p className="ex-note">{c.note}</p>}
                <div className="sc-foot">
                  <span className="tt">
                    <b>{c.foot.b}</b>
                    {c.foot.t}
                  </span>
                  <a className={c.cta.className} href={c.cta.href} data-service={c.cta.service} data-cta-location={c.cta.location}>
                    {c.cta.label}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
