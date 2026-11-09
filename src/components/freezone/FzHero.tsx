"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ACT_LABEL, EM_SHORT, HERO_DEMO, ZONES, ZONE_BY_ID } from "@/content/freezone";
import { CLAIMS, DISCLAIMER, statTile, zonesPhrase } from "@/content/site";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ArrowIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "./CallbackTrigger";

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

/** A text tile on the hero wall: a monogram, a name and a small line (no logos). */
export interface HeroTile {
  key: string;
  mono: string;
  title: string;
  sub: string;
}

/*
  Everything the hero says, so /mainland and /offshore reuse the same hero with their own content. The defaults are
  the /freezone page. Advice only: no prices, licences, residency or authority logos.
*/
export interface HeroConfig {
  tag: string;
  lead: string;
  accent: string;
  sub: string;
  /** Main call to action: opens the page's consultation pop-up. */
  primary: { label: string; location: string };
  /** Secondary call to action: a link on the page. */
  secondary: { label: string; href: string; location: string; external?: boolean };
  proof: { value: string; label: string }[];
  trustline: string;
  wall: HeroTile[];
  /** The rotating "often suited to" card: [left, right] pairs. */
  demo: [string, string][];
  demoLabel: string;
  /** Which wall tile lights up with each demo pair. */
  demoTile?: string[];
  badge: { small: string; b: string; span: string };
}

export const FZ_HERO: HeroConfig = {
  tag: "For founders choosing a UAE free zone",
  lead: "Compare UAE free zones with ",
  accent: "an advisor",
  sub: "Each UAE free zone covers different activities and offers different workspace options. Tell us your activity, and an advisor helps you compare the zones that may suit you.",
  primary: { label: "Book a Consultation", location: "FZ Hero - Book a Consultation" },
  secondary: { label: "Plan my free zone", href: "#planner", location: "FZ Hero - Plan My Free Zone" },
  proof: [statTile(CLAIMS.zones, "Free zones to compare", "office"), statTile(CLAIMS.emirates, "Emirates", "meet"), statTile(null, "", "explain")],
  trustline: "Private consultancy · Business Bay, Dubai",
  wall: ZONES.map((zn) => ({ key: zn.id, mono: zn.short[1], title: zn.short[0], sub: EM_SHORT[zn.emirate] })),
  demo: HERO_DEMO.map(([act, id]) => [ACT_LABEL[act], ZONE_BY_ID[id].name]),
  demoLabel: "Often suited to",
  demoTile: HERO_DEMO.map(([, id]) => id),
  badge: { small: zonesPhrase(), b: "Your advisor", span: "Advice in plain terms" },
};

export function FzHero({ c = FZ_HERO }: { c?: HeroConfig } = {}) {
  const LEAD = c.lead;
  const ACCENT = c.accent;
  const LEAD_WORDS = LEAD.trim().split(/\s+/).length;
  // Wall: three columns of tiles, each set twice so the scroll loops seamlessly.
  const COLUMNS = [0, 1, 2].map((col) => c.wall.filter((_, i) => i % 3 === col));
  const reduce = useReducedMotion();
  const [go, setGo] = useState(false);
  const [k, setK] = useState(0);
  const bar = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);

  const [left, right] = c.demo[k % c.demo.length];
  const lit = c.demoTile?.[k % c.demo.length];

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
            {c.tag}
          </p>
          <h1 id="fzTitle" className={`fz-split${go ? " go" : ""}`}>
            <SplitWords text={LEAD} start={0} />
            <span className="accent">
              <SplitWords text={ACCENT} start={LEAD_WORDS} hl />
            </span>
          </h1>
          <p className="fz-sub">{c.sub}</p>
          <div className="fz-cta-row">
            <CallbackTrigger className="btn btn-primary" location={c.primary.location}>
              {c.primary.label} <ArrowIcon />
            </CallbackTrigger>
            <a
              className="fz-btn-ghost"
              style={{ textDecoration: "none" }}
              href={c.secondary.href}
              data-cta-location={c.secondary.location}
              {...(c.secondary.external ? { target: "_blank", rel: "noopener" } : {})}
            >
              {c.secondary.label}
            </a>
          </div>
          <ul className="fz-proof" aria-label="At a glance">
            {/* A confirmed claim fills the number slot; until then plain text (content/site statTile). */}
            {c.proof.map((p) => (
              <li key={p.label}>
                <b>{p.value}</b>
                <span>{p.label}</span>
              </li>
            ))}
          </ul>
          {/* Phones: this one line replaces the stats and the decorative zone wall, so the form comes up sooner. */}
          <p className="fz-trustline">{c.trustline}</p>
          <p className="fz-disclaimer" role="note" data-legal>
            {DISCLAIMER}
          </p>
        </div>

        <div className="hx-visual" id="hxVisual" aria-hidden="true" ref={visual}>
          <div className="hx-wall" data-depth="6">
            <div className="hx-wall-in" id="hxWall">
              {COLUMNS.map((set, c) => (
                <div key={c} className={`hx-col hx-col${c}`}>
                  <div className="hx-track">
                    {[0, 1].flatMap((dup) =>
                      set.map((t) => (
                        <div key={`${dup}-${t.key}`} className={`hx-tile${t.key === lit ? " on" : ""}`}>
                          <span className="zl zl-txt zl-tile" aria-hidden="true">
                            <b>{t.mono}</b>
                          </span>
                          <div className="hx-tile-t">
                            <b>{t.title}</b>
                            <span>{t.sub}</span>
                          </div>
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
                {c.demoLabel}
              </span>
            </div>
            <div className="hx-match-row">
              <span className="hx-act hx-swap" key={`a${k}`}>
                {left}
              </span>
              <ArrowIcon />
              <b className="hx-swap" key={`z${k}`}>
                {right}
              </b>
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
              <small>{c.badge.small}</small>
              <b>{c.badge.b}</b>
              <span>{c.badge.span}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
