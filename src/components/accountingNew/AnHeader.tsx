"use client";

import { useEffect, useRef, useState } from "react";
import { AC_WHATSAPP } from "@/content/accounting";
import { SITE } from "@/content/site";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { AnCta } from "./AnLinks";
import { accTrack } from "./track";
// Header styles live in an-s1.css (one stylesheet with the hero, so no extra render-blocking file).
import "./an-s1.css";

/*
  The page header, in the style of the other landing pages (/services XsHeader): the logo, this page's section links,
  the phone number and a copper quote button. Sticky: at the top it sits on the hero; once the page scrolls it becomes
  a floating rounded bar. The quote button hides while the quote section is on screen. Phones: logo, call, WhatsApp and
  the section menu; under 900px a bottom bar (quote and WhatsApp) shows once the hero is gone, and hides over the quote
  section, while the cookie banner shows and while a form field has focus.
*/

const LOGO = (w: number) => `/_next/image?url=${encodeURIComponent(SITE.logo)}&w=${w}&q=75`;

const NAV = [
  ["Services", "#services"],
  ["How it works", "#how"],
  ["Reports", "#reports"],
  ["Reviews", "#reviews"],
  ["Questions", "#questions"],
] as const;

/** scrolled = the page has moved; past = the hero is above the screen; quote = the quote section is on screen; banner = the cookie banner shows; typing = a form field has focus. */
function usePageState() {
  const [st, setSt] = useState({ scrolled: false, past: false, quote: false, banner: false, typing: false });
  useEffect(() => {
    const set = (k: keyof typeof st, v: boolean) => setSt((o) => (o[k] === v ? o : { ...o, [k]: v }));
    const onScroll = () => set("scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const hero = document.querySelector(".an section.s1");
    const quote = document.getElementById("quote");
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (e.target === hero) set("past", !e.isIntersecting && e.boundingClientRect.top < 0);
        else set("quote", e.isIntersecting);
      }
    });
    if (hero) io.observe(hero);
    if (quote) io.observe(quote);
    const isField = (el: Element | null) => !!el?.matches?.("input, select, textarea");
    // The site cookie banner (rendered by the layout) is the region labelled by #consent-title while it shows.
    // Focus is re-read on DOM changes too: Safari sends no focusout when a focused field is removed.
    const check = () => {
      set("banner", !!document.getElementById("consent-title"));
      set("typing", isField(document.activeElement));
    };
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });
    check();
    const field = (e: FocusEvent) => set("typing", e.type === "focusin" && isField(e.target as Element));
    document.addEventListener("focusin", field);
    document.addEventListener("focusout", field);
    // In-page links: render every section first, so a skipped (content-visibility) section cannot change size
    // during the jump. Safari has no scroll anchoring to correct for that.
    const jump = (e: MouseEvent) => {
      if ((e.target as Element).closest?.("a[href^='#']")) document.querySelector(".an")?.classList.add("an-cv-off");
    };
    document.addEventListener("click", jump, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("focusin", field);
      document.removeEventListener("focusout", field);
      document.removeEventListener("click", jump, true);
    };
  }, []);
  return st;
}

export function AnHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => menu.current?.removeAttribute("open");
  const { scrolled, past, quote, banner, typing } = usePageState();
  const bar = past && !quote && !banner && !typing;
  return (
    <>
      <header className={scrolled ? "an-hd is-scrolled" : "an-hd"}>
        <div className="an-hd-bar">
          <a className="an-hd-logo" href="#" aria-label="Best Solution, back to top">
            {/* A plain <img> on the Next image optimizer (small WebP, 1x/2x) without next/image's client code, which cost
                the page about 0.2 s of Lighthouse LCP. Not preloaded: the logo is never the largest paint. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img src={LOGO(256)} srcSet={`${LOGO(256)} 1x, ${LOGO(384)} 2x`} alt="Best Solution" width={135} height={60} decoding="async" fetchPriority="low" />
          </a>
          <nav className="an-hd-nav" aria-label="Page sections">
            {NAV.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="an-hd-act">
            <a className="an-hd-phone an-num" href={SITE.phone.href}>
              <PhoneIcon />
              {SITE.phone.display}
            </a>
            <AnCta section="header" className={quote ? "an-hd-cta off" : "an-hd-cta"}>
              Get my quote today
            </AnCta>
            <div className="an-hd-icons">
              <a className="an-hd-ic" href={SITE.phone.href} aria-label={`Call ${SITE.phone.display}`}>
                <PhoneIcon />
              </a>
              <a className="an-hd-ic an-hd-wa" href={AC_WHATSAPP.question} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" onClick={() => accTrack("acc_cta_click", { section: "header_whatsapp" })}>
                <WhatsAppIcon />
              </a>
            </div>
            <details className="an-hd-menu" ref={menu}>
              <summary aria-label="Menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </summary>
              <nav className="an-hd-panel" aria-label="Menu" onClick={close}>
                {NAV.map(([label, href]) => (
                  <a key={href} href={href}>
                    {label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>
      <div className={bar ? "an-bar on" : "an-bar"}>
        <AnCta section="sticky_quote" className="an-btn1 an-bar-q">
          Get my quote
        </AnCta>
        <a className="an-btn2 an-bar-w" href={AC_WHATSAPP.question} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" onClick={() => accTrack("acc_cta_click", { section: "sticky_whatsapp" })}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F8F4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6L3 21z" />
          </svg>
        </a>
      </div>
    </>
  );
}
