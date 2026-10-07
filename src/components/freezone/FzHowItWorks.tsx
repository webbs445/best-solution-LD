"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/Icons";

const STEPS = [
  {
    time: "A few questions",
    title: "Shortlist",
    body: "Use the planner to see which zones fit your activity, with an estimate of your first-year cost.",
    icon: (
      <>
        <path d="M4 6h16M4 12h10M4 18h6" />
        <circle cx="18" cy="16" r="3" />
        <path d="m20.5 18.5 1.5 1.5" />
      </>
    ),
  },
  {
    time: "Complimentary call",
    title: "Consult",
    body: "Your dedicated advisor reviews your activity, team and customers, and narrows the list to the two or three most suitable zones.",
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
  },
  {
    time: "In writing",
    title: "Receive your plan",
    body: "You get a detailed estimate, a paperwork checklist and a realistic timeline, confirmed in writing.",
    icon: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13l2 2 4-4" />
      </>
    ),
  },
  {
    time: "Your decision",
    title: "Decide, with support",
    body: "You choose when you are ready. The same advisor stays with you for what comes next.",
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
];

/* "From first question to the right free zone": the step nearest the middle of the screen is highlighted. */
export function FzHowItWorks() {
  const list = useRef<HTMLOListElement>(null);
  const [best, setBest] = useState(0);

  useEffect(() => {
    const items = list.current?.querySelectorAll<HTMLElement>(".hw-card");
    if (!items?.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let idx = 0;
      let bd = Infinity;
      items.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bd) {
          bd = d;
          idx = i;
        }
      });
      setBest(idx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="fz-block hw" id="process" aria-labelledby="stepsTitle">
      <div className="wrap hw-grid">
        <div className="hw-side">
          <h2 id="stepsTitle">From first question to the right free zone</h2>
          <p>Four steps, one advisor, and nothing to commit to until you have a written plan.</p>
          <div className="hw-meter" aria-hidden="true">
            <b>0{best + 1}</b>
            <span>/ 04</span>
            <i>
              <em style={{ width: `${((best + 1) / STEPS.length) * 100}%` }} />
            </i>
          </div>
          <a className="btn btn-primary" href="#planner" data-cta-location="FZ How It Works — Start Step 1">
            Begin with Step 1 <ArrowIcon />
          </a>
        </div>
        <ol className="hw-list" ref={list}>
          {STEPS.map((s, i) => (
            <li key={s.title} className={`hw-card${i === best ? " on" : ""}`}>
              <div className="hw-n">0{i + 1}</div>
              <div className="hw-ico">
                <svg viewBox="0 0 24 24">{s.icon}</svg>
              </div>
              <div>
                <span className="hw-time">{s.time}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
