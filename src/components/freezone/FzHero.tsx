"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ACT_LABEL, EM_SHORT, HERO_DEMO, ZONES, ZONE_BY_ID } from "@/content/freezone";
import { formatAED } from "@/lib/pricing";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ArrowIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "./CallbackTrigger";
import { FzCount } from "./FzCount";
import { ZoneLogo } from "./ZoneLogo";

/* Headline words, each wrapped so it can slide up in turn (the accent words are highlighted). */
function SplitWords({ text, start, hl }: { text: string; start: number; hl?: boolean }) {
  const out: ReactNode[] = [];
  let i = start;
  text.split(/(\s+)/).forEach((t, k) => {
    if (!t) return;
    if (/^\s+$/.test(t)) out.push(t);
    else
      out.push(
        <span className="w" key={k}>
          <span className={hl ? "hl" : undefined} style={{ "--i": i++ } as CSSProperties}>
            {t}
          </span>
        </span>,
      );
  });
  return <>{out}</>;
}

const LEAD = "The right free zone costs less than the ";
const ACCENT = "wrong one";
const LEAD_WORDS = LEAD.trim().split(/\s+/).length;

/* Logo wall: three columns of zone tiles, each set twice so the scroll loops seamlessly. */
const COLUMNS = [0, 1, 2].map((c) => ZONES.filter((_, i) => i % 3 === c));

export function FzHero() {
  const reduce = useReducedMotion();
  const [go, setGo] = useState(false);
  const [k, setK] = useState(0);
  const bar = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);

  const [act, zoneId] = HERO_DEMO[k % HERO_DEMO.length];
  const zone = ZONE_BY_ID[zoneId];

  useEffect(() => {
    const t = window.setTimeout(() => setGo(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  // Rotate the "often suited to" card.
  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setK((n) => n + 1), 3400);
    return () => window.clearInterval(t);
  }, [reduce]);

  // Restart the progress bar on every rotation.
  useEffect(() => {
    const b = bar.current;
    if (!b || reduce) return;
    b.style.transition = "none";
    b.style.width = "0";
    void b.offsetWidth;
    b.style.transition = "width 3.2s linear";
    b.style.width = "100%";
  }, [k, reduce]);

  // Pointer parallax on the visual's layers (pointer devices only).
  useEffect(() => {
    const vis = visual.current;
    const host = vis?.parentElement;
    if (!vis || !host || reduce || !window.matchMedia("(hover:hover)").matches) return;
    const layers = vis.querySelectorAll<HTMLElement>("[data-depth]");
    const move = (e: PointerEvent) => {
      const r = vis.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => {
        const d = Number(l.dataset.depth);
        l.style.transform = `translate(${-x * d}px,${-y * d}px)`;
      });
    };
    const leave = () => layers.forEach((l) => (l.style.transform = ""));
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [reduce]);

  return (
    <section className="fz-hero hx" aria-labelledby="fzTitle">
      <div className="fz-hero-bg" aria-hidden="true">
        <i />
        <i />
        <b className="fz-blob b1" />
        <b className="fz-blob b2" />
      </div>
      <div className="wrap fz-hero-grid">
        <div className="fz-hero-copy">
          <p className="fz-tag">
            <span />
            UAE free zone advisory
          </p>
          <h1 id="fzTitle" className={`fz-split${go ? " go" : ""}`}>
            <SplitWords text={LEAD} start={0} />
            <span className="accent">
              <SplitWords text={ACCENT} start={LEAD_WORDS} hl />
            </span>
          </h1>
          <p className="fz-sub">
            Each UAE free zone allows different activities, sets different office rules and charges differently at
            renewal. Choose your activity, and we show you which zones fit, with an estimate of your first-year cost.
          </p>
          <div className="fz-cta-row">
            <a className="btn btn-primary" href="#planner" data-cta-location="FZ Hero — Plan My Free Zone">
              Plan My Free Zone <ArrowIcon />
            </a>
            <CallbackTrigger className="fz-btn-ghost" location="FZ Hero — Speak to an Advisor">
              Speak to an Advisor
            </CallbackTrigger>
          </div>
          <ul className="fz-proof" aria-label="At a glance">
            <li>
              <FzCount to={28} delay={500} />
              <span>Free zones compared</span>
            </li>
            <li>
              <FzCount to={7} delay={500} />
              <span>Emirates covered</span>
            </li>
            <li>
              <b>AED 4,898*</b>
              <span>Indicative starting price</span>
            </li>
          </ul>
          <p className="fz-foot">
            *Indicative starting price from our current rate card. Your cost depends on activity, package, office and
            residency.
          </p>
        </div>

        <div className="hx-visual" id="hxVisual" aria-hidden="true" ref={visual}>
          <div className="hx-wall" data-depth="6">
            <div className="hx-wall-in" id="hxWall">
              {COLUMNS.map((set, c) => (
                <div key={c} className={`hx-col hx-col${c}`}>
                  <div className="hx-track">
                    {[0, 1].flatMap((dup) =>
                      set.map((zn) => (
                        <div key={`${dup}-${zn.id}`} className={`hx-tile${zn.id === zoneId ? " on" : ""}`}>
                          <ZoneLogo zone={zn} size="zl-tile" alt={false} />
                          <div className="hx-tile-t">
                            <b>{zn.short[0]}</b>
                            <span>{EM_SHORT[zn.emirate]}</span>
                          </div>
                          <em>from AED {formatAED(zn.price)}</em>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hx-card hx-match" data-depth="22">
            <div className="hx-match-top">
              <span>
                <span className="hx-dot" />
                Often suited to
              </span>
            </div>
            <div className="hx-match-row">
              <span className="hx-act hx-swap" key={`a${k}`}>
                {ACT_LABEL[act]}
              </span>
              <ArrowIcon />
              <b className="hx-swap" key={`z${k}`}>
                {zone.name}
              </b>
            </div>
            <div className="hx-match-foot">
              <span>Starting from</span>
              <strong className="hx-swap" key={`p${k}`}>
                AED {formatAED(zone.price)}
              </strong>
            </div>
            <div className="hx-match-bar">
              <i ref={bar} />
            </div>
          </div>
          <div className="hx-card hx-price" data-depth="30">
            <span className="hx-pi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 21a8 8 0 0 1 13.292-6" />
                <circle cx="10" cy="8" r="5" />
                <path d="m16 19 2 2 4-4" />
              </svg>
            </span>
            <div>
              <small>28 free zones</small>
              <b>One advisor</b>
              <span>Every estimate includes a flexi-desk</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
