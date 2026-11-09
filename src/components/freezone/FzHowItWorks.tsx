"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "./CallbackTrigger";
import { claimText } from "@/content/site";

const STEPS = [
  {
    time: "A short form",
    title: "Tell us your plans",
    body: "Share your activity, your customers and your team, in the form or on WhatsApp.",
    icon: (
      <>
        <path d="M4 6h16M4 12h10M4 18h6" />
        <circle cx="18" cy="16" r="3" />
        <path d="m20.5 18.5 1.5 1.5" />
      </>
    ),
  },
  {
    time: "A conversation",
    title: "Consult",
    body: "Your advisor talks through your activity, team and customers, and the zones that may suit you.",
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
  },
  {
    time: "Your shortlist",
    title: "Compare",
    body: "You compare a short list of zones with your advisor, and what to plan for in each.",
    icon: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13l2 2 4-4" />
      </>
    ),
  },
  {
    time: "Your decision",
    title: "Decide in your own time",
    body: "You choose your next step when you are ready. Your advisor is there for any questions.",
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
];

/*
  "How a consultation works": four steps, the one nearest the middle of the screen highlighted. The defaults are the
  /freezone page's; other pages pass their own title and step lines (same icons, same layout).
*/
export interface HowItWorksText {
  title: string;
  sub: string;
  /** [small label, title, body] for each of the four steps. */
  steps: [string, string, string][];
  /** The button opens the consultation pop-up. */
  cta: { label: string; location: string };
}
export const FZ_HOW: HowItWorksText = {
  title: "From first question to the right free zone",
  sub: claimText("oneAdvisor", "Four steps, one advisor, and nothing to commit to.", "Four steps, and nothing to commit to."),
  steps: STEPS.map((x) => [x.time, x.title, x.body]),
  cta: { label: "Book a Consultation", location: "FZ How It Works - Book a Consultation" },
};
/** The same four steps in general words, for pages other than /freezone. */
export const GENERAL_HOW: HowItWorksText = {
  title: "How a consultation works",
  sub: claimText("oneAdvisor", "Four steps, one advisor, and nothing to commit to.", "Four steps, and nothing to commit to."),
  steps: [
    ["A short form", "Tell us your plans", "Share what your business does and what you want to achieve, in the form or on WhatsApp."],
    ["A conversation", "Consult", "Your advisor talks through your plans, in person in Business Bay or by video call."],
    ["Your options", "Compare", "You go through the options that may suit you, and what to plan for with each."],
    ["Your decision", "Decide in your own time", "You choose your next step when you are ready. Your advisor is there for any questions."],
  ],
  cta: { label: "Book a Consultation", location: "How It Works - Book a Consultation" },
};

export function FzHowItWorks({ c = FZ_HOW }: { c?: HowItWorksText } = {}) {
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
          <h2 id="stepsTitle">{c.title}</h2>
          <p>{c.sub}</p>
          <div className="hw-meter" aria-hidden="true">
            <b>0{best + 1}</b>
            <span>/ 04</span>
            <i>
              <em style={{ width: `${((best + 1) / STEPS.length) * 100}%` }} />
            </i>
          </div>
          <CallbackTrigger className="btn btn-primary" location={c.cta.location}>
            {c.cta.label} <ArrowIcon />
          </CallbackTrigger>
        </div>
        <ol className="hw-list" ref={list}>
          {STEPS.map((icon, i) => {
            const [time, title, body] = c.steps[i];
            return (
            <li key={title} className={`hw-card${i === best ? " on" : ""}`}>
              <div className="hw-n">0{i + 1}</div>
              <div className="hw-ico">
                <svg viewBox="0 0 24 24">{icon.icon}</svg>
              </div>
              <div>
                <span className="hw-time">{time}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
