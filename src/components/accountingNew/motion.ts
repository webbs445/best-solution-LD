"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

/*
  Shared motion hooks for /accounting-new. Every animation waits until its section scrolls into view
  (seen, once) and timers pause while the section is off screen (visible). Reduced motion shows final states.
*/

/** [ref, seen once, visible now]. `threshold` is the share of the element that must be on screen to count as seen. */
export function useInView<T extends Element>(threshold = 0.3): [RefObject<T | null>, boolean, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting && e.intersectionRatio >= Math.min(threshold, 0.99)) setSeen(true);
      },
      { threshold: [0, threshold] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen, visible];
}

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (on: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", on);
  return () => mq.removeEventListener("change", on);
};

/** True when the visitor asked for reduced motion. False on the server and during hydration. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);
}
