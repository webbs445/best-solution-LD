import Image from "next/image";
import { SITE, TRUST } from "@/content/site";
import { serviceById, type ServiceId } from "@/content/services";
import { formatAED } from "@/lib/pricing";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "@/components/freezone/CallbackTrigger";
import { ServiceIcon } from "./ServiceIcon";

const advised = TRUST.find((t) => t.label === "Businesses advised")!;

/* The "Starting prices" panel over the office photo: label, and the line under it (timing where published). */
const PLAN: [ServiceId, string, string?][] = [
  ["freezone", "Free zone company"],
  ["setup", "Mainland company"],
  ["accounting", "Accounting", "Bookkeeping and statements"],
];

/* The hero: headline, buttons and a stat strip on the left; the Best Solution office with a starting-prices panel on the right. */
export function SvHero() {
  return (
    <section className="fz-hero sv-hero" aria-labelledby="svTitle">
      <div className="fz-hero-bg" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="wrap fz-hero-grid sv-hero-grid">
        <div className="sv-hero-copy">
          <p className="fz-tag">
            <span />
            Best Solution services
          </p>
          <h1 id="svTitle">
            Set up and run your UAE business, <span className="accent sv-keep">with one consultant.</span>
          </h1>
          <h2 className="sv-hero-h2">Company setup, accounting, corporate tax and structuring, under one roof.</h2>
          <p className="fz-sub">See every service, its starting price and a free tool to begin with. Your costs are confirmed in writing before you proceed.</p>
          <div className="sv-hero-cta">
            <CallbackTrigger className="btn btn-primary" location="SV Hero — Book a Consultation">
              Book a Consultation <ArrowIcon />
            </CallbackTrigger>
            <a className="fz-btn-ghost" href="#services" data-cta-location="SV Hero — See All Services">
              See all services
            </a>
          </div>
          <ul className="sv-stats">
            <li>
              <b>
                {SITE.rating.score}
                <span className="sv-stars" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon key={i} />
                  ))}
                </span>
              </b>
              <span>From {SITE.rating.count}+ Google reviews</span>
            </li>
            <li>
              <b>{SITE.founded}</b>
              <span>Advising since</span>
            </li>
            <li>
              <b>
                {advised.count.toLocaleString("en-US")}
                {advised.suffix}
              </b>
              <span>Businesses advised</span>
            </li>
          </ul>
        </div>
        <div className="sv-visual">
          <div className="sv-photo">
            <Image src="/images/about-office.webp" alt="Best Solution office reception in Business Bay, Dubai" fill priority sizes="(max-width: 1020px) 100vw, 480px" />
          </div>
          <span className="sv-live qc-live">
            <i />
            Consultants available
          </span>
          <div className="sv-plan">
            <p className="sv-plan-h">
              Starting prices
              <small>Confirmed in writing</small>
            </p>
            <ul>
              {PLAN.map(([id, label, note]) => {
                const s = serviceById(id);
                return (
                  <li key={id}>
                    <a href={s.href} data-cta-location={`SV Hero — Price: ${label}`}>
                      <span className="sv-plan-ico">
                        <ServiceIcon id={id} />
                      </span>
                      <span className="sv-plan-name">
                        <b>{label}</b>
                        <small>{s.timing ?? note}</small>
                      </span>
                      <span className="sv-plan-price">
                        <small>from</small>
                        AED {formatAED(s.from!)}
                        {s.priceNote && <small>{s.priceNote}</small>}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
