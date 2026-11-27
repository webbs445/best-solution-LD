import { AnCta } from "./AnLinks";
import "./an-s8.css";

const QS = [
  { q: "My company is new and small. Do I need an accountant yet?", short: "Yes", lead: "Yes.", a: "Records are needed from day one, and your first Corporate Tax return is built on them. Small companies usually need only a light monthly service." },
  { q: "My books are months behind. Can you still help?", short: "Yes", lead: "Yes.", a: "We review what you have, list what's missing, and catch up month by month." },
  { q: "Can I switch accountants mid‑year?", short: "Yes", lead: "Yes.", a: "We take over your file, check it, and carry on." },
  { q: "Do you file my VAT and Corporate Tax returns?", short: "Yes", lead: "Yes.", a: "We prepare them from your books and file them for you, on time." },
  { q: "How much does it cost?", short: "Same-day quote", lead: "It depends on your volume.", a: "Tell us about your books and you get your quote the same day." },
];

/* The page builds its FAQPage JSON-LD from this: the visible question and answer text, word for word. */
export const AN_FAQS: { q: string; a: string }[] = QS.map((x) => ({ q: x.q, a: `${x.lead} ${x.a}` }));

/*
  Section 8: the FAQ. Native <details name> makes it an exclusive accordion with no script, keyboard-usable,
  and every answer stays in the HTML. The first question starts open, as in the design.
*/
export function AnFaq() {
  return (
    <section id="questions" className="s8">
      <div className="an-wrap s8-wrap">
        <div className="s8-head">
          <span className="s8-eye">Before you ask</span>
          <h2 className="an-h s8-h">
            Questions
            <br />
            <b>owners ask.</b>
          </h2>
          <p className="s8-lede">The five we hear most, answered straight. Four of them are yes.</p>
        </div>

        <div className="s8-list">
          {QS.map((x, i) => (
            <details className="s8-q" name="an-faq" open={i === 0} key={x.q}>
              <summary className="s8-qb">
                <span className="s8-n an-num">0{i + 1}</span>
                <span className="s8-qt">{x.q}</span>
                <span className="s8-pill" aria-hidden="true">{x.short}</span>
                <span className="s8-pm" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="s8-ans"><b>{x.lead}</b> {x.a}</p>
            </details>
          ))}
        </div>

        <div className="s8-ask">
          <span className="s8-askt">Your question isn&apos;t here?</span>
          <span className="s8-askb">Add it when you ask for your quote. An accountant answers it with your quote, the same working day.</span>
          <AnCta section={8} className="s8-go" topic="question">
            <span>
              Ask with my quote
              {/* Right arrow: it opens the quote pop-up rather than scrolling down. */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9714B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </AnCta>
        </div>
      </div>
    </section>
  );
}
