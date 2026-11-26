"use client";

import { SITE } from "@/content/site";
import { useInView } from "./motion";
import "./an-s7.css";

const STAR = "M10 1.8l2.5 5.3 5.7.7-4.2 4 1.1 5.7L10 14.7l-5.1 2.8L6 11.8l-4.2-4 5.7-.7z";
const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const ROWS = [
  { icon: <><path d="M12 3 3 8l9 5 9-5z" /><path d="M7 10.5V15c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" /></>, b: "Qualified accountants,", t: " in our Business Bay office." },
  { icon: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></>, b: "Your software or ours:", t: " Zoho Books, QuickBooks, Tally." },
  { icon: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />, b: "One monthly call", t: " to go through your report." },
  { icon: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, b: "Your data is seen only", t: " by the team on your account." },
];

// The highlight wraps across lines, so each word carries its own underline and they draw one after another.
const HL = ["structured,", "professional,", "and", "stress-free"];

/* Section 7: qualified accountants and two Google reviews. The underline under the quote draws once in view. */
export function AnTeam() {
  const [ref, seen] = useInView<HTMLElement>(0.3);
  return (
    <section id="reviews" className={`s7${seen ? " s7-on" : ""}`} ref={ref}>
      <div className="an-wrap s7-in">
        <div className="s7-top">
          <div className="s7-head">
            <span className="s7-eye">Who keeps your books</span>
            <h2 className="an-h s7-h">
              Qualified accountants
              <br />
              <b>
                who know <br className="s7-pbr" />
                your numbers.
              </b>
            </h2>
          </div>
          <p className="s7-lede">More than data entry. People who read your numbers and tell you what they mean.</p>
        </div>

        <div className="s7-body">
          <figure className="s7-hq">
            <span className="s7-mark" aria-hidden="true">“</span>
            <blockquote className="s7-qt">
              Everything became{" "}
              <b>
                {HL.map((w, i) => (
                  <span key={w}>
                    <span className="s7-ul" style={{ ["--i" as string]: i }}>{w}</span>
                    {i < HL.length - 1 ? " " : ""}
                  </span>
                ))}
              </b>{" "}
              after switching to Best Solution.
            </blockquote>
            <figcaption className="s7-cap">
              <span className="s7-who">
                <span className="s7-av" aria-hidden="true">H</span>
                <span>
                  <b>Hadi H.</b>
                  <span>CEO, Soft Miller</span>
                </span>
              </span>
              <span className="s7-rate">
                <span className="s7-stars" role="img" aria-label="5 stars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d={STAR} /></svg>
                  ))}
                </span>
                <span className="s7-src">Google review</span>
              </span>
            </figcaption>
          </figure>

          <div className="s7-side">
            <div className="s7-letter">
              <div className="s7-lh"><b>ON YOUR ACCOUNT</b><span>Every client, every month</span></div>
              {ROWS.map((r) => (
                <div className="s7-row" key={r.b}>
                  <span className="s7-ic"><svg width="18" height="18" viewBox="0 0 24 24" {...ICON}>{r.icon}</svg></span>
                  <p><b>{r.b}</b>{r.t}</p>
                </div>
              ))}
            </div>

            <figure className="s7-sq">
              <p>“25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands.”</p>
              <figcaption className="s7-sqcap">
                <span className="s7-sqwho"><b>Michael D.</b> · CEO, Doherty Capital</span>
                <span className="s7-sqsrc"><span aria-hidden="true">★★★★★</span><span className="an-sr">5 stars</span> Google review</span>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="s7-foot">
          <span className="s7-real">Real reviews from real owners, <b>word for word.</b></span>
          <a href={SITE.googleReviews} className="s7-go" target="_blank" rel="noopener noreferrer">
            <span>
              Read our Google reviews{" "}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9714B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
