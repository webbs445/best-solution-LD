"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/content/site";
import { AC_NAV, AC_WHATSAPP } from "@/content/accounting";

/*
  Page chrome for /accounting: the reading progress bar, the header (light over light sections, solid over
  dark ones, with the current section's link highlighted), the menu drawer on phones and the bottom bar.
*/
export function AcChrome() {
  const prog = useRef<HTMLDivElement>(null);
  const [light, setLight] = useState(false);
  const [solid, setSolid] = useState(false);
  const [mbar, setMbar] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (prog.current) prog.current.style.width = `${h > 0 ? (y / h) * 100 : 0}%`;
      // The header turns light over light sections and solid over dark ones.
      const probe = 40;
      const overDark = [...document.querySelectorAll(".ac-page .dark-zone")].some((z) => {
        const r = z.getBoundingClientRect();
        return r.top < probe && r.bottom > probe;
      });
      setLight(!overDark);
      setSolid(overDark && y > 20);
      setMbar(y > window.innerHeight * 0.6);
      let cur: string | null = null;
      AC_NAV.forEach((n) => {
        const s = document.querySelector(n.href);
        if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = n.href;
      });
      setActive(cur);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <>
      <div className="progress" ref={prog} />

      <header className={`top${light ? " light" : ""}${solid ? " solid" : ""}`} id="hdr">
        <div className="wrap">
          <a className="logo" href="#top" aria-label="Best Solution home">
            <Image className="l-light" src={SITE.mark} alt="Best Solution logo" width={124} height={58} priority />
            <Image className="l-dark" src={SITE.logo} alt="" width={131} height={58} aria-hidden="true" priority />
          </a>
          <nav className="nav" aria-label="Page sections" id="nav">
            {AC_NAV.map((n) => (
              <a key={n.href} href={n.href} className={active === n.href ? "act" : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
          <a className="btn btn-copper" href="#contact" data-cta-location="AC Header — Get a quote">
            Get a quote
          </a>
          <button
            type="button"
            className="burger"
            aria-label="Open menu"
            aria-expanded={drawer}
            aria-controls="drawer"
            onClick={() => setDrawer(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      <div
        className={`drawer${drawer ? " open" : ""}`}
        id="drawer"
        aria-hidden={!drawer}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t === e.currentTarget || t.tagName === "A") setDrawer(false);
        }}
      >
        <nav aria-label="Mobile menu">
          <div className="dh">
            <Image src={SITE.logo} alt="Best Solution logo" width={131} height={58} />
            <button type="button" className="x" aria-label="Close menu" onClick={() => setDrawer(false)}>
              &times;
            </button>
          </div>
          {AC_NAV.map((n) => (
            <a key={n.href} href={n.href} tabIndex={drawer ? undefined : -1}>
              {n.long}
            </a>
          ))}
          <a className="btn btn-copper" href="#contact" tabIndex={drawer ? undefined : -1} data-cta-location="AC Menu — Get a quote">
            Get a quote
          </a>
        </nav>
      </div>

      <div className={`mbar${mbar ? " on" : ""}`} id="mbar">
        <a href={SITE.phone.href}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
          </svg>
          Call
        </a>
        <a href={AC_WHATSAPP.quote} target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z" />
          </svg>
          WhatsApp
        </a>
        <a className="q" href="#contact" data-cta-location="AC Mobile Bar — Get a quote">
          Get a quote
        </a>
      </div>
    </>
  );
}
