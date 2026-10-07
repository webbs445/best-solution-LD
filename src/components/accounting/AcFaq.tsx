"use client";

import { useEffect, useRef, useState } from "react";
import { AC_FAQS, AC_WHATSAPP } from "@/content/accounting";
import { SITE } from "@/content/site";
import { trackFaqExpand } from "@/lib/analytics";

/* "Straight answers": one question open at a time, height animated; opens reported as faq_expand. */
export function AcFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const answers = useRef<(HTMLDivElement | null)[]>([]);

  // Animate each answer's height to its content (0 when closed).
  useEffect(() => {
    answers.current.forEach((a, i) => {
      if (a) a.style.height = i === open ? `${a.scrollHeight}px` : "0";
    });
  }, [open]);

  return (
    <section className="sheet s-white light-zone" id="faq">
      <div className="wrap faq-grid">
        <div className="faq-side rv">
          <span className="kicker">Questions</span>
          <h2 style={{ marginTop: 16 }}>Straight answers.</h2>
          <p className="lede">The way an accountant would explain it across a desk.</p>
          <div className="help">
            <b>Still have a question?</b>
            <p>Speak to an accountant directly. {SITE.hours.short}.</p>
            <a className="btn btn-copper" href={AC_WHATSAPP.question} target="_blank" rel="noopener">
              WhatsApp an accountant
            </a>
          </div>
        </div>
        <div id="faqList" className="rv d1">
          {AC_FAQS.map((f, i) => (
            <div key={f.q} className={`qa${open === i ? " open" : ""}`}>
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => {
                  const next = open === i ? null : i;
                  setOpen(next);
                  if (next !== null) trackFaqExpand(f.q);
                }}
              >
                {f.q}
                <span className="pm" />
              </button>
              <div
                className="ans"
                ref={(el) => {
                  answers.current[i] = el;
                }}
              >
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
