"use client";

import { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/components/ui/useCountUp";
import { formatAED } from "@/lib/pricing";

/* A figure that counts up from zero once it scrolls into view. Server HTML carries the real value. */
export function FzCount({ to, suffix = "", delay = 0 }: { to: number; suffix?: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(false);
  const value = useCountUp(to, { duration: 1100, run, clientOnly: false });

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => setRun(true), delay);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [delay]);

  return (
    <b ref={ref}>
      {formatAED(value)}
      {suffix}
    </b>
  );
}
