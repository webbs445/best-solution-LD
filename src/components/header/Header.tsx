"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/content/site";
import { CtaLink } from "@/components/ui/CtaLink";
import { MenuIcon, PhoneIcon } from "@/components/ui/Icons";
import styles from "./Header.module.css";

/** Floating header matched to best-solution.ae: a rounded bar that gains a stronger shadow once the page scrolls. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const wide = window.matchMedia("(min-width: 1021px)");
    const onWide = () => wide.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <header ref={rootRef} className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <div className={styles.bar}>
          <a className={styles.logo} href="#top" aria-label="Best Solution, back to top">
            <Image
              src={SITE.logo}
              alt="Best Solution, Business Begins Here"
              width={360}
              height={160}
              loading="eager"
              fetchPriority="high"
            />
          </a>

          <nav className={styles.nav} aria-label="On this page">
            {NAV.map((item, i) => (
              <span key={item.href} className={styles.navItem}>
                {i === NAV.length - 1 && <span className={styles.navDiv} aria-hidden="true" />}
                <a href={item.href}>{item.label}</a>
              </span>
            ))}
          </nav>

          <div className={styles.actions}>
            <CtaLink className={`${styles.cta} ${styles.ctaBar}`} href="#calculator" location="LP Header — Free Consultation">
              <PhoneIcon />
              <span>Free Consultation</span>
            </CtaLink>
            <button
              className={styles.burger}
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <MenuIcon open={open} />
            </button>
          </div>
        </div>

        <nav
          id="site-menu"
          className={styles.menu}
          hidden={!open}
          aria-label="Menu"
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        >
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <a className={styles.menuPhone} href={SITE.phone.href}>
            <PhoneIcon />
            {SITE.phone.display}
          </a>
          <CtaLink className={styles.cta} href="#calculator" location="LP Header Menu — Free Consultation">
            <PhoneIcon />
            <span>Free Consultation</span>
          </CtaLink>
        </nav>
      </div>
    </header>
  );
}
