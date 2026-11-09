"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SITE_MENU } from "@/content/services";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import "./servicesMenu.css";

const CHEVRON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/*
  The /services header's Services dropdown, as one component for every page header: Services (the hub), then each
  service page (content/services SITE_MENU). Escape or a click outside closes it. Phones use each page's own menu.
*/
export function ServicesMenu({ align = "start" }: { align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="svm" ref={ref}>
      <button type="button" className="svm-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        Services
        {CHEVRON}
      </button>
      <div className={`svm-panel${align === "end" ? " svm-end" : ""}`} id={id} hidden={!open}>
        {SITE_MENU.map((s) => (
          <a key={s.id} className="svm-item" href={s.href} onClick={() => setOpen(false)}>
            <span className="svm-ico">
              <ServiceIcon id={s.id === "hub" ? "setup" : s.id} />
            </span>
            <span>
              <b>{s.label}</b>
              <small>{s.line}</small>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
