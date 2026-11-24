"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
  Hydrates a below-the-fold section only when it comes within about one screen of view, or is touched or focused
  first. Until then the server HTML stays exactly as sent (the empty dangerouslySetInnerHTML on the client keeps it,
  without React work), so the page's first seconds on a phone are not spent on sections nobody has reached. Not for
  sections with form fields a visitor could type into before it hydrates.
*/
export function LazySection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (on || !el) return;
    const go = () => setOn(true);
    if (!("IntersectionObserver" in window)) return go();
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && go(), { rootMargin: "800px 0px" });
    io.observe(el);
    el.addEventListener("pointerdown", go, { once: true });
    el.addEventListener("focusin", go, { once: true });
    return () => {
      io.disconnect();
      el.removeEventListener("pointerdown", go);
      el.removeEventListener("focusin", go);
    };
  }, [on]);

  // Server: the section's HTML. Client, until near: keep that HTML as is.
  if (on || typeof window === "undefined") return <div ref={ref}>{children}</div>;
  return <div ref={ref} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />;
}
