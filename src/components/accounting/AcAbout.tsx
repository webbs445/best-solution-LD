"use client";

import { useEffect, useRef } from "react";

const PLAIN = "Most businesses don't struggle with revenue. They struggle with not knowing their numbers.";
const ACCENT = "We fix that, every single month.";

/* A statement whose words light up as it scrolls past. */
export function AcAbout() {
  const statement = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const st = statement.current;
    if (!st) return;
    const words = [...st.querySelectorAll<HTMLSpanElement>("span.sw")];
    let ticking = false;
    const hl = () => {
      ticking = false;
      const r = st.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.35)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(hl);
      }
    };
    hl();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const words = (text: string, accent: boolean) =>
    text.split(" ").flatMap((w, i) => [
      i ? " " : null,
      <span key={`${accent}${i}`} className={accent ? "sw c" : "sw"}>
        {w}
      </span>,
    ]);

  return (
    <section className="sheet s-white light-zone" id="about">
      <div className="wrap">
        <p className="statement" id="statement" ref={statement}>
          {words(PLAIN, false)} <span style={{ color: "inherit" }}>{words(ACCENT, true)}</span>
        </p>
      </div>
    </section>
  );
}
