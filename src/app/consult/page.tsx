import type { Metadata } from "next";
import Image from "next/image";
import { SITE } from "@/content/site";
import {
  CONSULT_CONFIRM,
  CONSULT_CONTACT,
  CONSULT_DISCLAIMER,
  CONSULT_FAQS,
  CONSULT_HELP,
  CONSULT_REVIEWS,
  CONSULT_STEPS,
  CONSULT_URL,
  CONSULT_WHY,
} from "@/content/consult";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";
import { PhoneIcon, WhatsAppIcon } from "@/components/ui/Icons";
import "./consult.css";

const TITLE = "Private Business Advisors in Dubai | Best Solution";
const DESCRIPTION = "Get a second opinion on your plans from private advisors in Business Bay. Clear advice, no pressure. Book a consultation.";

// noindex comes from the root layout (robots) and the X-Robots-Tag header, as on every page of this subdomain.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CONSULT_URL },
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, url: CONSULT_URL },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

/* LocalBusiness only: no Service schema, no prices, no FAQPage. */
const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Best Solution",
  url: CONSULT_URL,
  telephone: "+971522330011",
  email: CONSULT_CONTACT.email,
  address: { "@type": "PostalAddress", addressLocality: "Business Bay, Dubai", addressCountry: "AE" },
};

const Disclaimer = ({ className }: { className: string }) => (
  <p className={className} role="note">
    {CONSULT_DISCLAIMER}
  </p>
);

/*
  /consult: the advice-only landing page for Google Ads. Advice and consultation only: no prices, timelines,
  government services or links to the priced pages. GTM, consent and the cookie banner come from the root layout;
  call and WhatsApp taps are reported by AnalyticsInit (phone_click / whatsapp_click).
*/
export default function ConsultPage() {
  const year = new Date().getFullYear();
  return (
    <div className="ad-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="ad-header">
        <div className="ad-wrap ad-header-in">
          <a className="ad-brand" href="#top" aria-label="Best Solution, back to top">
            <Image src="/brand/icon-mark.webp" alt="" width={28} height={40} priority />
            <span>Best Solution</span>
          </a>
          <div className="ad-head-cta">
            <a className="ad-hbtn" href={CONSULT_CONTACT.phone.href} aria-label="Call Best Solution">
              <PhoneIcon />
              <span>Call</span>
            </a>
            <a className="ad-hbtn ad-hbtn-wa" href={CONSULT_CONTACT.whatsapp.href} target="_blank" rel="noopener" aria-label="WhatsApp Best Solution">
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="ad-hero" aria-labelledby="adTitle">
          <div className="ad-wrap">
            <h1 id="adTitle">Talk to a private business advisor in Dubai</h1>
            <p className="ad-sub">Get a second opinion on your plans before you decide. Clear advice, no pressure, from our team in Business Bay.</p>
            <div className="ad-hero-cta" data-area="ADV Hero">
              <a className="btn btn-primary ad-book" href="#book" data-cta-location="ADV Hero - Book a Consultation">
                Book a Consultation
              </a>
              <div className="ad-hero-alt">
                <a className="ad-alt" href={CONSULT_CONTACT.whatsapp.href} target="_blank" rel="noopener">
                  <WhatsAppIcon /> WhatsApp
                </a>
                <a className="ad-alt" href={CONSULT_CONTACT.phone.href}>
                  <PhoneIcon /> Call
                </a>
              </div>
            </div>
            <Disclaimer className="ad-disclaimer" />
          </div>
        </section>

        <section className="ad-sec" aria-labelledby="adHelpTitle">
          <div className="ad-wrap">
            <h2 id="adHelpTitle">What we help you think through</h2>
            <ul className="ad-cards">
              {CONSULT_HELP.map((c) => (
                <li key={c.title}>
                  <span className="ad-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={c.icon} />
                    </svg>
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ad-sec ad-sec-tint" aria-labelledby="adHowTitle">
          <div className="ad-wrap ad-how">
            <div>
              <h2 id="adHowTitle">How a consultation works</h2>
              <ol className="ad-steps">
                {CONSULT_STEPS.map((s, i) => (
                  <li key={s.title}>
                    <span className="ad-step-n">{i + 1}</span>
                    <div>
                      <h3>{s.title}</h3>
                      {s.body && <p>{s.body}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <figure className="ad-photo">
              <Image
                src="/images/why-consultation.webp"
                alt="An advisor meeting clients at the Best Solution office in Business Bay"
                width={760}
                height={563}
                sizes="(max-width: 900px) 100vw, 520px"
              />
            </figure>
          </div>
        </section>

        <section className="ad-sec" aria-labelledby="adWhyTitle">
          <div className="ad-wrap">
            <h2 id="adWhyTitle">Why people talk to us</h2>
            <ul className="ad-why">
              {CONSULT_WHY.map((w) => (
                <li key={w}>
                  <span aria-hidden="true">✓</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {CONSULT_REVIEWS.length > 0 && (
          <section className="ad-sec ad-sec-tint" aria-labelledby="adRevTitle">
            <div className="ad-wrap">
              <h2 id="adRevTitle">What clients say</h2>
              <ul className="ad-reviews">
                {CONSULT_REVIEWS.map((r) => (
                  <li key={r.name + r.date}>
                    <blockquote>&ldquo;{r.quote}&rdquo;</blockquote>
                    <p>
                      {r.name}, {r.date} · Google review
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="ad-sec" aria-labelledby="adFaqTitle">
          <div className="ad-wrap ad-narrow">
            <h2 id="adFaqTitle">Questions</h2>
            <div className="ad-faq">
              {CONSULT_FAQS.map((f) => (
                <details key={f.q} data-faq-question={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ad-sec ad-book-sec" id="book" aria-labelledby="adBookTitle">
          <div className="ad-wrap ad-book-grid">
            <div className="ad-book-copy">
              <h2 id="adBookTitle">Book a consultation</h2>
              <p>{`Tell us a little about your plans and an advisor will contact you${CONSULT_CONFIRM.replyTime ? ` ${CONSULT_CONFIRM.replyTime}` : ""}.`}</p>
              <div className="ad-book-alt" data-area="ADV Book">
                <a className="ad-alt" href={CONSULT_CONTACT.whatsapp.href} target="_blank" rel="noopener">
                  <WhatsAppIcon /> WhatsApp
                </a>
                <a className="ad-alt" href={CONSULT_CONTACT.phone.href}>
                  <PhoneIcon /> Call
                </a>
              </div>
            </div>
            <div className="ad-form-card">
              <ConsultForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="ad-footer">
        <div className="ad-wrap">
          <p className="ad-foot-contact">
            <span>Best Solution, Business Bay, Dubai</span>
            <span>
              Phone <a href={CONSULT_CONTACT.phone.href}>{CONSULT_CONTACT.phone.display}</a>
            </span>
            <span>
              WhatsApp{" "}
              <a href={CONSULT_CONTACT.whatsapp.href} target="_blank" rel="noopener">
                {CONSULT_CONTACT.whatsapp.display}
              </a>
            </span>
            <a href={`mailto:${CONSULT_CONTACT.email}`}>{CONSULT_CONTACT.email}</a>
          </p>
          <nav className="ad-foot-links" aria-label="Legal">
            <a href={SITE.privacy} target="_blank" rel="noopener">
              Privacy Policy
            </a>
            <a href={SITE.terms} target="_blank" rel="noopener">
              Terms
            </a>
            <CookieSettingsButton />
          </nav>
          <Disclaimer className="ad-foot-disclaimer" />
          <p className="ad-copy">&copy; {year} Best Solution</p>
        </div>
      </footer>
    </div>
  );
}
