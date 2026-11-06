"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/content/site";
import { SERVICES } from "@/content/services";
import { MenuIcon, PhoneIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "@/components/freezone/CallbackTrigger";
import { ServiceIcon } from "./ServiceIcon";

const LINKS = [
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

/* The /services header: the /freezone header's bar with a Services dropdown. On phones the menu lists the services first. */
export function SvHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes either menu; a click outside closes the dropdown.
  useEffect(() => {
    if (!open && !dd) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setDd(false));
    const onDown = (e: PointerEvent) => dd && !ddRef.current?.contains(e.target as Node) && setDd(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, dd]);

  return (
    <header className={`bs-header${scrolled ? " is-scrolled" : ""}`} id="bsHeader">
      <div className="bs-header-in">
        <div className="bs-bar">
          <a className="bs-logo bs-logo-text" href="#top" aria-label="Best Solution, back to top">
            <Image src="/brand/icon-mark.webp" alt="" width={28} height={40} priority />
            <span>Best Solution</span>
          </a>
          <nav className="bs-nav" aria-label="Main">
            <div className="sv-dd" ref={ddRef}>
              <button type="button" className="sv-dd-btn" aria-expanded={dd} aria-controls="svServices" onClick={() => setDd((d) => !d)}>
                Services
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="sv-dd-panel" id="svServices" hidden={!dd}>
                {SERVICES.map((s) => (
                  <a key={s.id} href={s.href} onClick={() => setDd(false)}>
                    <span className="sv-ico">
                      <ServiceIcon id={s.id} />
                    </span>
                    <span>
                      <b>{s.name}</b>
                      <small>{s.line}</small>
                    </span>
                  </a>
                ))}
              </div>
            </div>
            {LINKS.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="bs-actions">
            <a className="bs-phone" href={SITE.phone.href}>
              <PhoneIcon />
              <span>{SITE.phone.display}</span>
            </a>
            <CallbackTrigger className="bs-cta" location="SV Header - Book a Consultation">
              <PhoneIcon />
              <span>Book a Consultation</span>
            </CallbackTrigger>
            <button
              className="bs-burger"
              type="button"
              aria-expanded={open}
              aria-controls="bsMenu"
              aria-label={open ? "Close menu" : "Show menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <MenuIcon open={false} />
            </button>
          </div>
        </div>
        <div className="bs-menu sv-menu" id="bsMenu" hidden={!open} onClick={(e) => (e.target as Element).closest("a, button") && setOpen(false)}>
          <p className="sv-menu-h">Services</p>
          {SERVICES.map((s) => (
            <a key={s.id} href={s.href} className="sv-menu-svc">
              <span className="sv-ico">
                <ServiceIcon id={s.id} />
              </span>
              {s.name}
            </a>
          ))}
          <span className="sv-menu-div" aria-hidden="true" />
          {LINKS.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
          <CallbackTrigger className="bs-cta" location="SV Menu - Book a Consultation">
            <PhoneIcon />
            <span>Book a Consultation</span>
          </CallbackTrigger>
        </div>
      </div>
    </header>
  );
}
