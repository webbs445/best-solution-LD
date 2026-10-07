import Image from "next/image";
import type { ReactNode } from "react";
import { AC_CLAIMS, AC_OFFER, AC_OFFER_EXTRA, AC_WHATSAPP } from "@/content/accounting";
import { MAPS_URL, SITE } from "@/content/site";
import { CookieSettingsButton } from "@/components/analytics/CookieConsentBanner";

const ARROW = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
);
const ico = (body: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {body}
  </svg>
);

/* /accounting footer: closing CTA, link columns, wordmark and disclaimer. Server component. */
export function AcFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-foot dark-zone">
      <div className="wrap">
        <div className="f-cta rv">
          <div>
            <h3>Clean books begin with one conversation.</h3>
            <p>
              {AC_OFFER}, confirmed in writing. No obligation.{AC_OFFER_EXTRA && ` ${AC_OFFER_EXTRA}`}
            </p>
          </div>
          <div className="acts">
            <a className="btn btn-white" href="#contact" data-cta-location="AC Footer — Get a quote">
              Get a quote
            </a>
            <a className="btn btn-line" href={AC_WHATSAPP.talk} target="_blank" rel="noopener">
              WhatsApp us
            </a>
          </div>
        </div>

        <div className="f-grid">
          <div className="f-brand">
            <Image src={SITE.mark} alt="Best Solution logo" width={128} height={60} />
            <p>Bookkeeping, bank reconciliation and financial statements for UAE businesses, from our office in Business Bay, Dubai.</p>
            <div className="badges">
              <span>
                <em>★</em> {AC_CLAIMS.rating} Google rating
              </span>
              <span>{AC_CLAIMS.ownership}</span>
              <span>Since {AC_CLAIMS.founded}</span>
            </div>
          </div>
          <div className="f-col">
            <h5>Services</h5>
            <a href="#contact" data-service="bookkeeping">
              Bookkeeping
            </a>
            <a href="#contact" data-service="reconciliation">
              Bank reconciliation
            </a>
            <a href="#contact" data-service="statements">
              Financial statements
            </a>
            <a href="#contact" data-service="complete">
              Complete package
            </a>
          </div>
          <div className="f-col">
            <h5>Explore</h5>
            <a href="#check">Health check</a>
            <a href="#process">How it works</a>
            <a href="#reports">Monthly reports</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="f-col">
            <h5>Contact</h5>
            <a href={SITE.phone.href}>
              {ico(
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
              )}
              {SITE.phone.display}
            </a>
            <a href={`mailto:${SITE.email}`}>
              {ico(
                <>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </>,
              )}
              {SITE.email}
            </a>
            <a href={MAPS_URL} target="_blank" rel="noopener">
              {ico(
                <>
                  <path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z" />
                  <circle cx="12" cy="10" r="2.5" />
                </>,
              )}
              Business Bay, Dubai
            </a>
            <span>
              {ico(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>,
              )}
              {SITE.hours.short}
            </span>
          </div>
        </div>

        <div className="wordmark" aria-hidden="true">
          best solution
        </div>

        <div className="f-bottom">
          <p className="disc">
            {ico(
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" />
              </>,
            )}
            <span>
              Best Solution® is a private business consultancy based in Business Bay, Dubai. We are not affiliated with the
              Federal Tax Authority or any other government entity, and we do not issue government documents. Tax
              registrations, assessments, refunds and penalties are decided solely by the relevant UAE authorities. Prices shown are from-prices,
              exclude VAT and are confirmed in a written quote. Reports and figures on this page are illustrations.
            </span>
          </p>
          <div className="f-meta">
            <span>© {year} Best Solution®</span>
            <a href={SITE.privacy} target="_blank" rel="noopener">
              Privacy policy
            </a>
            <CookieSettingsButton />
            <a className="totop" href="#top">
              Top {ARROW}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
