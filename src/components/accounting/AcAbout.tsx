"use client";

import { useEffect, useRef } from "react";
import { AC_STATS } from "@/content/accounting";

const PLAIN = "Most businesses don't struggle with revenue. They struggle with not knowing their numbers.";
const ACCENT = "We fix that, every single month.";

/* Stats (counted up by AcMotion when revealed) and a statement whose words light up as it scrolls past. */
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
        <div className="stats">
          {AC_STATS.map((s, i) => (
            <div key={s.label} className={`stat rv${i ? ` d${i}` : ""}`}>
              <b>
                <span className="cnt" data-to={s.to}>
                  {s.to.toLocaleString("en-US")}
                </span>
                <em>+</em>
              </b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <p className="statement" id="statement" ref={statement}>
          {words(PLAIN, false)} <span style={{ color: "inherit" }}>{words(ACCENT, true)}</span>
        </p>
      </div>
    </section>
  );
}
