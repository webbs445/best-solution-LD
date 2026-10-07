"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Process.module.css";

const STEPS = [
  { title: "Estimate", body: "Use the calculator to view your expected first-year cost.", meta: "A few questions" },
  { title: "Consult", body: "Your advisor reviews your objectives and recommends a structure.", meta: "Complimentary, no obligation" },
  { title: "Decide", body: "You receive a written cost and timeline, and choose whether to proceed.", meta: "Confirmed in writing" },
];

/* The rail fills, and each step lights up, as the timeline passes 60% of the viewport height. */
export function Timeline() {
  const listRef = useRef<HTMLOListElement>(null);
  const [fill, setFill] = useState(0);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.innerHeight * 0.6;
      const r = list.getBoundingClientRect();
      setFill(Math.max(0, Math.min(1, (mid - r.top) / r.height)));
      setLit([...list.querySelectorAll("li")].filter((li) => li.getBoundingClientRect().top < mid).length);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div className={styles.tl}>
      <span className={styles.rail} aria-hidden="true">
        <i style={{ height: `${fill * 100}%` }} />
      </span>
      <ol ref={listRef}>
        {STEPS.map((s, i) => (
          <li key={s.title} className={i < lit ? styles.on : undefined}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.num} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={styles.body}>
              <p className={styles.label}>Step {i + 1}</p>
              <h3>{s.title}</h3>
              <p className={styles.text}>{s.body}</p>
              <p className={styles.meta}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                  <circle cx="10" cy="10" r="7.5" />
                  <path d="M10 6v4l2.5 1.5" />
                </svg>
                {s.meta}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
