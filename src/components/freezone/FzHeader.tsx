"use client";

import Image from "next/image";
import { Fragment, useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { FZ_NAV } from "@/content/freezone";
import { MenuIcon, PhoneIcon } from "@/components/ui/Icons";

export function FzHeader() {
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
          <a className="bs-logo" href="#top" aria-label="Best Solution, back to top">
            <Image src={SITE.logo} alt="Best Solution, Business Begins Here" width={180} height={80} priority />
          </a>
          <nav className="bs-nav" aria-label="On this page">
            {FZ_NAV.map((n, i) => (
              <Fragment key={n.href}>
                {i === FZ_NAV.length - 1 && <span className="bs-nav-div" aria-hidden="true" />}
                <a href={n.href}>{n.label}</a>
              </Fragment>
            ))}
          </nav>
          <div className="bs-actions">
            <a className="bs-phone" href={SITE.phone.href}>
              <PhoneIcon />
              <span>{SITE.phone.display}</span>
            </a>
            <a className="bs-cta" href="#planner" data-cta-location="FZ Header — Free Consultation">
              <PhoneIcon />
              <span>Free Consultation</span>
            </a>
            <button
              className="bs-burger"
              type="button"
              aria-expanded={open}
              aria-controls="bsMenu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <MenuIcon open={false} />
            </button>
          </div>
        </div>
        <div className="bs-menu" id="bsMenu" hidden={!open} onClick={(e) => (e.target as Element).closest("a") && setOpen(false)}>
          {FZ_NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
          <a className="bs-cta" href="#planner" data-cta-location="FZ Menu — Free Consultation">
            <PhoneIcon />
            <span>Free Consultation</span>
          </a>
        </div>
      </div>
    </header>
  );
}
