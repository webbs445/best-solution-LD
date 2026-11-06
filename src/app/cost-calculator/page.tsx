import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DISCLAIMER, SITE } from "@/content/site";
import { CC_FAQ, CC_HERO, CC_PLAN, CC_STEPS, CC_STRUCTURES, CC_URL, CC_WA_TEXT } from "@/content/costCalculator";
import { CC_QUOTE_FORM_ID } from "@/lib/lead";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/Icons";
import "./cost-calculator.css";

const TITLE = "Plan Your UAE Company Budget | Best Solution";
const DESCRIPTION =
  "Understand the cost areas to plan for when running a UAE company: workspace, team, yearly costs, bookkeeping and corporate tax. Book a consultation with a private advisor.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CC_URL },
  // openGraph and twitter replace the layout's objects rather than merging, so the shared fields are repeated.
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, url: CC_URL },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CC_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const WA = `${SITE.whatsapp}?text=${encodeURIComponent(CC_WA_TEXT)}`;

// One outline icon per "What to plan for" card, in CC_PLAN order.
const PLAN_ICONS = [
  "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6",
  "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7",
  "M4 5h16v16H4zM4 10h16M9 3v4M15 3v4",
  "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  "M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
];

const Arrow = () => (
  <svg className="arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/*
  /cost-calculator: "Plan your budget", an advice-only page (Google Ads, Government documents and services policy).
  The old configurator, its prices and its price pop-up are gone; the consultation form keeps the page's quote form id
  so conversion history continues. /api/cost-calculator stays for old clients. GTM, consent and the cookie banner come
  from the root layout; call and WhatsApp taps are reported by AnalyticsInit.
*/
export default function CostCalculatorPage() {
  const year = new Date().getFullYear();
  return (
    <div className="cc-page" lang="en">
      <a className="skip-link" href="#consultation">
        Skip to the consultation form
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <header className="hd">
        <div className="wrap hd-in">
          <a className="brand" href="#top" aria-label="Best Solution, back to top">
            <Image src="/brand/icon-mark.webp" alt="" width={28} height={40} priority />
            <span>Best Solution</span>
          </a>
          <nav className="nav" aria-label="Page sections">
            <a href="#plan">What to plan for</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            <a href="#consultation">Consultation</a>
          </nav>
          <div className="hd-act">
            <a className="hbtn" href={SITE.phone.href} data-area="Header" aria-label="Call Best Solution">
              <PhoneIcon />
              <span>Call</span>
            </a>
            <a className="hbtn hbtn-wa" href={WA} target="_blank" rel="noopener" data-area="Header" aria-label="WhatsApp Best Solution">
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="h1">
          <div className="wrap">
            <span className="kick">{CC_HERO.kicker}</span>
            <h1 id="h1">
              {CC_HERO.title} <span className="gr">{CC_HERO.accent}</span>
            </h1>
            <p className="lead">{CC_HERO.lead}</p>
            <div className="hero-cta">
              <a className="btn btn-cu" href="#consultation" data-cta-location="CC Hero - Book a consultation">
                <span>Book a consultation</span>
                <Arrow />
              </a>
              <a className="btn btn-soft" href={WA} target="_blank" rel="noopener" data-area="Hero">
                Ask on WhatsApp
              </a>
            </div>
            <p className="legal" role="note" data-legal>
              {DISCLAIMER}
            </p>
          </div>
        </section>

        <section className="sec alt" id="plan" aria-labelledby="h-plan">
          <div className="wrap">
            <div className="sec-h">
              <div>
                <span className="kick">What to plan for</span>
                <h2 id="h-plan">The cost areas to think through</h2>
              </div>
              <p>Every company is different. These are the areas we go through with you, so nothing important is left out of your budget.</p>
            </div>
            <div className="plan-g">
              {CC_PLAN.map((c, i) => (
                <div className="wy" key={c.title}>
                  <span className="wi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={PLAN_ICONS[i]} />
                    </svg>
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  {c.link && (
                    <a className="more" href={c.link.href}>
                      {c.link.label}
                    </a>
                  )}
                </div>
              ))}
            </div>
            <h3 className="cmp-h">Mainland, free zone or offshore</h3>
            <div className="cmp3">
              {CC_STRUCTURES.map(([t, b]) => (
                <div key={t}>
                  <h4>{t}</h4>
                  <p>{b}</p>
                </div>
              ))}
            </div>
            <p className="cmp-more">
              Your advisor compares the three with you. <Link href="/freezone">Read more about free zones</Link>
            </p>
          </div>
        </section>

        <section className="sec how" id="how" aria-labelledby="h-how">
          <div className="wrap">
            <div className="sec-h">
              <div>
                <span className="kick">How a consultation works</span>
                <h2 id="h-how">Three simple steps</h2>
              </div>
              <p>A conversation with a private advisor about your plans and the costs to expect.</p>
            </div>
            <ol className="nx">
              {CC_STEPS.map(([t, b], i) => (
                <li key={t}>
                  <span>{i + 1}</span>
                  <div>
                    <b>{t}</b>
                    <p>{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="sec alt" id="faq" aria-labelledby="h-fq">
          <div className="wrap fq-g">
            <div className="fq-side">
              <span className="kick">FAQ</span>
              <h2 id="h-fq">Questions about planning your budget</h2>
              <p>Something else? Message an advisor on WhatsApp.</p>
              <a className="btn btn-soft" href={WA} target="_blank" rel="noopener" data-area="FAQ">
                Ask on WhatsApp
              </a>
            </div>
            <div>
              {CC_FAQ.map(([q, a], i) => (
                <details className="qa" key={q} open={i === 0}>
                  <summary>
                    {q}
                    <i />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="consultation" aria-labelledby="h-bk">
          <div className="wrap bk-g">
            <div>
              <span className="kick">Consultation</span>
              <h2 id="h-bk">Book a consultation</h2>
              <p>Tell us a little about your plans and an advisor will contact you to arrange a time.</p>
              <div className="con">
                <a href={SITE.phone.href} data-area="Consultation">
                  <PhoneIcon />
                  {SITE.phone.display}
                </a>
                <a href={`mailto:${SITE.email}`} data-area="Consultation">
                  <MailIcon />
                  {SITE.email}
                </a>
              </div>
            </div>
            <div className="bk-card" data-area="Quote Form">
              <ConsultForm formId={CC_QUOTE_FORM_ID} formType="calculator" idPrefix="cc" />
            </div>
          </div>
        </section>
      </main>

      <footer className="ft">
        <div className="wrap">
          <div className="ft-top">
            <div>
              <span className="ft-brand">
                <Image src="/brand/icon-mark.webp" alt="" width={28} height={40} />
                Best Solution
              </span>
              <p>Private business advisors in Business Bay, Dubai.</p>
            </div>
            <div>
              <h4>On this page</h4>
              <a href="#plan">What to plan for</a>
              <a href="#how">How it works</a>
              <a href="#faq">FAQ</a>
              <a href="#consultation">Consultation</a>
            </div>
            <div>
              <h4>Contact</h4>
              <a href={SITE.phone.href} data-area="Footer" dir="ltr">
                {SITE.phone.display}
              </a>
              <a href={WA} target="_blank" rel="noopener" data-area="Footer">
                WhatsApp
              </a>
              <a href={`mailto:${SITE.email}`} data-area="Footer">
                {SITE.email}
              </a>
            </div>
          </div>
          <p className="ft-legal" data-legal>
            {DISCLAIMER}
          </p>
          <div className="ft-bot">
            <span>© {year} Best Solution</span>
            <nav aria-label="Legal">
              <a href={SITE.privacy}>Privacy policy</a>
              <a href={SITE.terms}>Terms</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
