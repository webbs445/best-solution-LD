"use client";

import { useState } from "react";
import { FZ_FAQS, FZ_FAQ_TOPICS, type FaqTopic } from "@/content/freezone";
import { trackEvent } from "@/lib/analytics";
import { ArrowIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "./CallbackTrigger";

/* Free zone FAQ: topic tabs, one question open at a time. Opens are reported by AnalyticsInit (data-faq-question). */
export function FzFaq() {
  const [topic, setTopic] = useState<FaqTopic | "all">("all");
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="fz-block fq" id="faq" aria-labelledby="faqTitle">
      <div className="wrap">
        <div className="fq-head">
          <h2 id="faqTitle">Free zone questions, answered</h2>
          <div className="fq-tabs" role="tablist" aria-label="Question topics">
            {FZ_FAQ_TOPICS.map((t) => (
              <button
                key={t.c}
                type="button"
                role="tab"
                aria-selected={topic === t.c}
                onClick={() => {
                  setTopic(t.c);
                  trackEvent("faq_tab", { topic: t.c });
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* Re-keyed per topic so the visible questions replay their entrance animation. */}
        <div className="fq-grid" key={topic}>
          {FZ_FAQS.map((f, i) => (
            <details
              key={f.q}
              data-c={f.c}
              data-faq-question={f.q}
              className={topic !== "all" && f.c !== topic ? "hide" : undefined}
              open={open === i}
              onToggle={(e) => {
                const isOpen = e.currentTarget.open;
                setOpen((cur) => (isOpen ? i : cur === i ? null : cur));
              }}
            >
              <summary>
                <span className="fq-n">{String(i + 1).padStart(2, "0")}</span>
                {f.q}
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="fq-cta">
          <div>
            <b>Still have a question?</b>
            <span>Your advisor can answer it on a short call.</span>
          </div>
          <CallbackTrigger className="btn btn-primary" location="FZ FAQ — Request a Callback">
            Request a Callback <ArrowIcon />
          </CallbackTrigger>
        </div>
      </div>
    </section>
  );
}
