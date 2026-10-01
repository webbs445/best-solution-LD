"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./Marquee.module.css";

/*
  The track holds two equal halves and slides by one half, so the loop is seamless. Each half
  repeats the set as often as needed to be at least as wide as the row, so a short list never
  leaves a gap on wide screens. The duration scales with the repeats to keep the same speed.
*/
export function MarqueeLoop({
  original,
  copy,
  speed,
  reverse,
  className,
  label,
}: {
  original: ReactNode;
  copy: ReactNode;
  speed: number;
  reverse: boolean;
  className: string;
  label?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [repeats, setRepeats] = useState(1);

  useEffect(() => {
    const row = rowRef.current;
    const first = trackRef.current?.firstElementChild;
    if (!row || !first) return;
    const measure = () => {
      const setWidth = first.getBoundingClientRect().width;
      if (setWidth > 0) setRepeats(Math.max(1, Math.ceil(row.clientWidth / setWidth)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(first);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rowRef}
      className={`${styles.marquee} ${reverse ? styles.reverse : ""} ${className}`}
      style={{ "--speed": `${speed * repeats}s` } as CSSProperties}
      role={label ? "region" : undefined}
      aria-label={label}
    >
      <div ref={trackRef} className={styles.track}>
        {original}
        {Array.from({ length: repeats * 2 - 1 }, (_, i) => (
          <Fragment key={i}>{copy}</Fragment>
        ))}
      </div>
    </div>
  );
}
