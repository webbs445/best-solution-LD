"use client";

import { useState } from "react";
import { SPV_FAQS, SPV_WA_HREF } from "@/content/spv";
import { trackFaqExpand } from "@/lib/analytics";

/* FAQ (one answer open at a time). The same questions feed the page's FAQPage schema. */
export function SpvFaq() {
  const [open, setOpen] = useState(0);
  const toggle = (i: number) => {
    const next = open === i ? -1 : i;
    setOpen(next);
    if (next >= 0) trackFaqExpand(SPV_FAQS[i].q);
  };
  return (
    <section className="sec light sheet" id="faq">
      <div className="wrap fq">
        <div className="fq-side rv">
          <span className="eyebrow">Questions</span>
          <h2 style={{ marginTop: "18px" }}>Straight answers.</h2>
          <p className="lede" style={{ marginTop: "18px" }}>
            The questions clients ask most before their first consultation.
          </p>
          <div className="fq-card">
            <b>Still have a question?</b>
            <p>Ask our structuring team directly.</p>
            <div className="fq-r">
              <a className="btn btn-cu" href="#consult" data-cta-location="SPV FAQ Book">
                Book a consultation
              </a>
              <a className="btn btn-wh" href={SPV_WA_HREF} target="_blank" rel="noopener" data-area="SPV FAQ">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="rv d1" id="faqList">
          {SPV_FAQS.map((f, i) => (
            <div key={f.q} className={`qa${open === i ? " open" : ""}`}>
              <button type="button" aria-expanded={open === i} aria-controls={`spv-faq-${i}`} onClick={() => toggle(i)}>
                {f.q}
                <span className="pm" aria-hidden="true" />
              </button>
              <div className="ans" id={`spv-faq-${i}`}>
                <div>
                  <p>{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
