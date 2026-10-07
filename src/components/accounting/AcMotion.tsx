"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/useReducedMotion";

/*
  Page-wide motion for /accounting: scroll reveals (.rv gets data-in, which React never overwrites),
  number count-ups (.cnt inside a revealed block) and the cursor spotlight on .spotlight cards.
*/
export function AcMotion() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const countUp = (el: HTMLElement) => {
      const to = Number(el.dataset.to);
      if (reduced || !to) {
        el.textContent = to.toLocaleString("en-US");
        return;
      }
      let t0: number | null = null;
      const f = (t: number) => {
        if (t0 === null) t0 = t;
        const p = Math.min(1, (t - t0) / 1600);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    };

    const nodes = document.querySelectorAll<HTMLElement>(".ac-page .rv");
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            el.setAttribute("data-in", "");
            const c = el.querySelector<HTMLElement>(".cnt");
            if (c) countUp(c);
            io?.unobserve(el);
          }),
        { rootMargin: "0px 0px -8% 0px" },
      );
      nodes.forEach((n) => io?.observe(n));
    } else nodes.forEach((n) => n.setAttribute("data-in", ""));

    const offs: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".ac-page .spotlight").forEach((c) => {
      const move = (e: MouseEvent) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      c.addEventListener("mousemove", move);
      offs.push(() => c.removeEventListener("mousemove", move));
    });

    return () => {
      io?.disconnect();
      offs.forEach((f) => f());
    };
  }, []);

  return null;
}
