"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

/**
 * Eases a number from `from` to `to`. By default the first render returns `to`, so server
 * HTML carries the real figure; pass `clientOnly` for UI that never renders on the server.
 */
export function useCountUp(
  to: number,
  { from = 0, duration = 900, run = true, clientOnly = false } = {},
): number {
  const [value, setValue] = useState(clientOnly && run ? from : to);

  useEffect(() => {
    if (!run || prefersReducedMotion()) {
      const id = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    let start: number | null = null;
    const frame = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [to, from, duration, run]);

  return value;
}
