"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SITE } from "@/content/site";
import { AC_CLAIMS, AC_OFFER, AC_OFFER_EXTRA, MARQUEE, TYPED_WORDS, aed } from "@/content/accounting";
import { prefersReducedMotion, useReducedMotion } from "@/lib/useReducedMotion";

const ARROW = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
);
const TICK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5 9-10" />
  </svg>
);

const DOCS: { title: string; note: string; icon: ReactNode }[] = [
  {
    title: "Invoices and bills",
    note: "Sales and purchases",
    icon: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </>
    ),
  },
  {
    title: "Bank statements",
    note: "Every business account",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
  },
  {
    title: "Receipts and payroll",
    note: "Photo, PDF or software",
    icon: (
      <>
        <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
];

/* Typed rotator: deletes the current word, types the next, pauses. */
function useTyped(words: string[]) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let wi = 0;
    let ci = words[0].length;
    let del = true;
    let timer = 0;
    const tick = () => {
      if (del) {
        ci--;
        if (ci <= 0) {
          del = false;
          wi = (wi + 1) % words.length;
        }
      } else {
        ci++;
        if (ci >= words[wi].length) {
          del = true;
          setText(words[wi]);
          timer = window.setTimeout(tick, 1800);
          return;
        }
      }
      setText(words[wi].slice(0, Math.max(ci, 0)) || " ");
      timer = window.setTimeout(tick, del ? 40 : 70);
    };
    timer = window.setTimeout(tick, 2400);
    return () => window.clearTimeout(timer);
  }, [words]);
  return text;
}

export function AcHero() {
  const typed = useTyped(TYPED_WORDS);
  const reduce = useReducedMotion();
  const [step, setDone] = useState(0);
  // With reduced motion every report simply shows as done.
  const done = reduce ? 3 : step;
  const flow = useRef<HTMLDivElement>(null);
  const wires = useRef<SVGSVGElement>(null);

  // Monthly close sequence: each report ticks to done, then the loop restarts.
  useEffect(() => {
    if (reduce) return;
    let step = 0;
    let timer = 0;
    const seq = () => {
      if (step < 3) {
        step++;
        setDone(step);
        timer = window.setTimeout(seq, 1100);
        return;
      }
      timer = window.setTimeout(() => {
        step = 0;
        setDone(0);
        timer = window.setTimeout(seq, 1200);
      }, 4200);
    };
    timer = window.setTimeout(seq, 1600);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  // Wires from each document to the team disc, and from the disc to each report, with dots travelling along them.
  useEffect(() => {
    const root = flow.current;
    const svg = wires.current;
    if (!root || !svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const reduced = prefersReducedMotion();
    const box = (el: HTMLElement) => {
      let x = 0;
      let y = 0;
      let e: HTMLElement | null = el;
      while (e && e !== root) {
        x += e.offsetLeft;
        y += e.offsetTop;
        e = e.offsetParent as HTMLElement | null;
      }
      return { left: x, top: y, width: el.offsetWidth, height: el.offsetHeight, right: x + el.offsetWidth };
    };
    const draw = () => {
      svg.querySelectorAll("path, circle").forEach((n) => n.remove());
      if (window.innerWidth <= 900) return;
      const discEl = root.querySelector<HTMLElement>(".disc");
      if (!discEl) return;
      const disc = box(discEl);
      const cx = disc.left + disc.width / 2;
      const cy = disc.top + disc.height / 2;
      const rad = disc.width / 2;
      const add = (d: string, delay: number) => {
        const id = `w${Math.random().toString(36).slice(2, 8)}`;
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("id", id);
        svg.appendChild(p);
        if (reduced) return;
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("r", "3.5");
        const m = document.createElementNS(NS, "animateMotion");
        m.setAttribute("dur", "2.6s");
        m.setAttribute("repeatCount", "indefinite");
        m.setAttribute("begin", `${delay}s`);
        const mp = document.createElementNS(NS, "mpath");
        mp.setAttribute("href", `#${id}`);
        m.appendChild(mp);
        c.appendChild(m);
        svg.appendChild(c);
      };
      const curve = (x1: number, y1: number, x2: number, y2: number) =>
        `M${x1} ${y1} C ${x1 + (x2 - x1) * 0.55} ${y1}, ${x1 + (x2 - x1) * 0.45} ${y2}, ${x2} ${y2}`;
      root.querySelectorAll<HTMLElement>("#fin .doc").forEach((d, i) => {
        const r = box(d);
        add(curve(r.right, r.top + r.height / 2, cx - rad, cy), i * 0.5);
      });
      root.querySelectorAll<HTMLElement>("#fout .rep-card").forEach((d, i) => {
        const r = box(d);
        add(curve(cx + rad, cy, r.left, r.top + r.height / 2), 1.3 + i * 0.5);
      });
    };
    const timers = [window.setTimeout(draw, 300), window.setTimeout(draw, 1300)];
    window.addEventListener("load", draw);
    window.addEventListener("resize", draw);
    document.fonts?.ready.then(draw);
    const ro = "ResizeObserver" in window ? new ResizeObserver(draw) : null;
    ro?.observe(root);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("load", draw);
      window.removeEventListener("resize", draw);
      ro?.disconnect();
    };
  }, []);

  // Magnetic primary buttons on pointer devices.
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer:fine)").matches) return;
    const offs: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".ac-page .hero .mag").forEach((b) => {
      const move = (e: MouseEvent) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px,${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      };
      const leave = () => (b.style.transform = "");
      b.addEventListener("mousemove", move);
      b.addEventListener("mouseleave", leave);
      offs.push(() => {
        b.removeEventListener("mousemove", move);
        b.removeEventListener("mouseleave", leave);
      });
    });
    return () => offs.forEach((f) => f());
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="dots-bg" aria-hidden="true" />

      <div className="wrap">
        <div className="h-center">
          {/* The hero text is in the server HTML with a CSS-only entrance, so it paints before any script runs. */}
          <a className="announce hin" href="#contact" data-cta-location="AC Hero — Fixed monthly quote">
            <span className="at">Accounting for UAE businesses</span>{" "}
            <b>
              Fixed monthly quote{" "}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </b>
          </a>
          <h1 className="hin d1">
            Clean books.{" "}
            <br />
            <span className="l2">
              <span className="grad-text">Every month.</span>
              <svg viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 22 C 90 6, 200 4, 396 16" />
              </svg>
            </span>
          </h1>
          <div className="typer hin d2" aria-live="off">
            We handle your <b id="typed">{typed}</b>
          </div>
          <p className="sub hin d2">
            You send your invoices and statements. Our accounting team in Business Bay sends back reconciled books and reports you can
            actually read.
          </p>
          <div className="ctas hin d3">
            <a className="btn btn-copper mag" href="#contact" data-cta-location="AC Hero — Get a fixed monthly quote">
              {AC_OFFER} {ARROW}
            </a>
            <a className="btn btn-glass mag" href="#services" data-cta-location="AC Hero — See pricing">
              See pricing
            </a>
          </div>
          {AC_OFFER_EXTRA && <p className="offer-extra hin d3">{AC_OFFER_EXTRA}</p>}
          <div className="proofrow hin d3">
            <div className="avs" aria-hidden="true">
              <span>H</span>
              <span>M</span>
              <span>S</span>
              <span>{Math.round(AC_CLAIMS.businesses / 1000)}k</span>
            </div>
            <div className="rt">
              <b>{AC_CLAIMS.rating}</b>
              <span className="st">★★★★★</span>
              <small>{AC_CLAIMS.reviewCount}+ Google reviews</small>
            </div>
            <span className="sep" />
            <div className="rt">
              <b>{AC_CLAIMS.ownership}</b>
              <small>Advising since {AC_CLAIMS.founded}</small>
            </div>
            <span className="sep" />
            <div className="rt">
              <b>From {aed(AC_CLAIMS.prices.bookkeeping)}</b>
              <small>per month, bookkeeping</small>
            </div>
          </div>
        </div>

        <div className="flow rv d2" id="flow" ref={flow} aria-label="Illustration: your invoices and statements go in, finished reports come out">
          <svg className="wires" id="wires" ref={wires} aria-hidden="true">
            <defs>
              <linearGradient id="wg" x1="0" x2="1">
                <stop offset="0" stopColor="#14253e" stopOpacity=".18" />
                <stop offset=".5" stopColor="#cc8667" stopOpacity=".95" />
                <stop offset="1" stopColor="#14253e" stopOpacity=".18" />
              </linearGradient>
            </defs>
          </svg>

          <div className="fcol in" id="fin">
            <span className="cap">You send</span>
            {DOCS.map((d) => (
              <div className="doc" key={d.title}>
                <span className="di">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {d.icon}
                  </svg>
                </span>
                <div>
                  <b>{d.title}</b>
                  <small>{d.note}</small>
                </div>
                <span className="pulse" />
              </div>
            ))}
          </div>

          <div className="core" id="core">
            <span className="halo" />
            <span className="orbit" />
            <span className="orbit o2" />
            <div className="disc">
              <Image src={SITE.mark} alt="" aria-hidden="true" width={124} height={58} />
              <small>Accounting team</small>
            </div>
            <div className="closebar">
              <div className="r">
                <span>Monthly close</span>
                <b id="closePct">{done} of 3 reports</b>
              </div>
              <div className="tr">
                <i id="closeBar" style={{ width: `${(done / 3) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="fcol out" id="fout">
            <span className="cap">You receive</span>
            <div className={`rep-card${done >= 1 ? " done" : ""}`}>
              <div className="rh">
                <b>Profit and Loss</b>
                <span className="st-pill">
                  {TICK}
                  <span>Ready</span>
                </span>
              </div>
              <div className="big">AED 29,530</div>
              <div className="sm">Net profit this month</div>
              <div className="mini">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className={`rep-card${done >= 2 ? " done" : ""}`}>
              <div className="rh">
                <b>Bank reconciled</b>
                <span className="st-pill">
                  {TICK}
                  <span>Matched</span>
                </span>
              </div>
              <div className="big">AED 0.00</div>
              <div className="sm">Difference across 3 accounts</div>
            </div>
            <div className={`rep-card${done >= 3 ? " done" : ""}`}>
              <div className="rh">
                <b>Balance Sheet</b>
                <span className="st-pill">
                  {TICK}
                  <span>Sent</span>
                </span>
              </div>
              <div className="sm" style={{ marginTop: 6 }}>
                Plus Cash Flow, ready for your review call
              </div>
            </div>
          </div>

          <p className="illus">Illustration only. Figures are examples.</p>
        </div>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="mq">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
