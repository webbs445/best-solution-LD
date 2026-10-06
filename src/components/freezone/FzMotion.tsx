"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

/* Blocks that rise into view as they scroll in (styles: .rv / .rv.in in freezone.css). */
const REVEAL = [
  ".fz-head-split",
  ".pl-panel",
  ".zx-tools",
  ".fz-vs-table",
  ".fz-vs-note",
  ".fz-consult-copy",
  ".fz-brief",
  ".hw-side",
  ".wy-top",
  ".wy-mosaic figure",
  ".wy-cards article",
  ".fq-head",
  ".fq-cta",
  ".fz-close-in",
  ".partners-head",
  ".t-head",
].join(",");

/*
  Page-wide motion for /freezone: the reading progress bar, scroll reveals, the cursor spotlight on
  .spot panels and the magnetic primary buttons in the hero and closing sections. Decorative only:
  everything is visible without it, and reveals and magnets are skipped for reduced motion.
*/
export function FzMotion() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      if (bar.current) bar.current.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    const nodes = document.querySelectorAll<HTMLElement>(`.fz-page :is(${REVEAL})`);
    nodes.forEach((n) => {
      const i = n.parentElement ? Array.prototype.indexOf.call(n.parentElement.children, n) : 0;
      n.classList.add("rv");
      n.style.setProperty("--d", `${Math.min(i, 6) * 0.07}s`);
    });
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".fz-page .spot").forEach((c) => {
      const move = (e: PointerEvent) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      c.addEventListener("pointermove", move);
      cleanups.push(() => c.removeEventListener("pointermove", move));
    });

    if (!prefersReducedMotion() && window.matchMedia("(hover:hover)").matches) {
      document.querySelectorAll<HTMLElement>(".fz-hero .btn-primary, .fz-close .btn-primary").forEach((b) => {
        const move = (e: PointerEvent) => {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.12}px,${(e.clientY - r.top - r.height / 2) * 0.2}px)`;
        };
        const leave = () => (b.style.transform = "");
        b.addEventListener("pointermove", move);
        b.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          b.removeEventListener("pointermove", move);
          b.removeEventListener("pointerleave", leave);
        });
      });
    }
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return <div className="fz-progress" aria-hidden="true" ref={bar} />;
}
