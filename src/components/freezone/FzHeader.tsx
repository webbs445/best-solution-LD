"use client";

import Image from "next/image";
import { Fragment, useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { FZ_NAV } from "@/content/freezone";
import { ALL_SERVICES } from "@/content/services";
import { OPEN_CALLBACK } from "@/components/sections/Callback";
import { MenuIcon, PhoneIcon } from "@/components/ui/Icons";
import { ServicesMenu } from "@/components/ui/ServicesMenu";

/* Header for /freezone, /mainland and /offshore: the page's own section links, "All services", and the main call to action. */
export function FzHeader({ nav = FZ_NAV, tag = "FZ" }: { nav?: { href: string; label: string }[]; tag?: string } = {}) {
  // "Book a Consultation" opens the page's consultation pop-up (the footer's callback form).
  const book = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event(OPEN_CALLBACK));
  };
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`bs-header${scrolled ? " is-scrolled" : ""}`} id="bsHeader">
      <div className="bs-header-in">
        <div className="bs-bar">
          <a className="bs-logo bs-logo-text" href="#top" aria-label="Best Solution, back to top">
            <Image src="/brand/icon-mark.webp" alt="" width={28} height={40} priority />
            <span>Best Solution</span>
          </a>
          <nav className="bs-nav" aria-label="On this page">
            {nav.map((n) => (
              <Fragment key={n.href}>
                <a href={n.href}>{n.label}</a>
              </Fragment>
            ))}
            <span className="bs-nav-div" aria-hidden="true" />
            <ServicesMenu align="end" />
          </nav>
          <div className="bs-actions">
            <a className="bs-phone" href={SITE.phone.href}>
              <PhoneIcon />
              <span>{SITE.phone.display}</span>
            </a>
            <a className="bs-cta" href="#consult" onClick={book} aria-controls="cbModal" data-cta-location={`${tag} Header - Book a Consultation`}>
              <PhoneIcon />
              <span>Book a Consultation</span>
            </a>
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
        <div className="bs-menu" id="bsMenu" hidden={!open} onClick={(e) => (e.target as Element).closest("a") && setOpen(false)}>
          {nav.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
          <a href={ALL_SERVICES.href}>{ALL_SERVICES.label}</a>
          <a className="bs-cta" href="#consult" onClick={book} aria-controls="cbModal" data-cta-location={`${tag} Menu - Book a Consultation`}>
            <PhoneIcon />
            <span>Book a Consultation</span>
          </a>
        </div>
      </div>
    </header>
  );
}
