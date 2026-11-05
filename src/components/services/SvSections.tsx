import Image from "next/image";
import { SITE, TRUST, WHY } from "@/content/site";
import { JOURNEY, SERVICES, SHOW_TEAM, TEAM } from "@/content/services";
import { formatAED } from "@/lib/pricing";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { CallbackTrigger } from "@/components/freezone/CallbackTrigger";
import { ServiceIcon } from "./ServiceIcon";

/* The /services page's static sections. Server components: no client JavaScript. */

const price = (s: (typeof SERVICES)[number]) => (s.from !== null ? `From AED ${formatAED(s.from)}${s.priceNote ?? ""}` : s.priceNote);

/* The hub: one tile per service page. Company setup and Free zone are the large tiles. */
export function SvGrid() {
  return (
    <section className="fz-block sv-grid-sec" id="services" aria-labelledby="svGridTitle">
      <div className="wrap">
        <div className="fz-head-split">
          <h2 id="svGridTitle">Every service, one consultant</h2>
          <p>Pick a service to see its starting price and a free tool to get started.</p>
        </div>
        <ul className="sv-grid">
          {SERVICES.map((s) => (
            // The whole tile opens the service page (stretched link); the tool tag is its own link to the tool.
            <li key={s.id} className={s.big ? "big" : undefined}>
              <article className="sv-tile spot">
                <span className="sv-tile-ico">
                  <ServiceIcon id={s.id} />
                </span>
                <a className="sv-chip sv-tile-tool" href={s.tool.href} data-cta-location={`SV Grid — Tool: ${s.tool.label}`}>
                  2-minute {s.tool.tag}
                </a>
                <h3>
                  <a className="sv-tile-main" href={s.href} data-cta-location={`SV Grid — ${s.name}`}>
                    {s.name}
                  </a>
                </h3>
                <p>{s.line}</p>
                {s.timing && <p className="sv-tile-time">{s.timing}</p>}
                <span className="sv-tile-foot">
                  <b>{price(s)}</b>
                  <span className="sv-tile-go" aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </span>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* "Your business journey": five stages, each opening the page that serves it. */
export function SvJourney() {
  return (
    <section className="fz-block sv-journey" id="journey" aria-labelledby="svJourneyTitle">
      <div className="wrap">
        <div className="fz-head-split fz-on-navy">
          <h2 id="svJourneyTitle">Your business journey</h2>
          <p>We stay with you from the first licence onwards. Tap a stage to see how we help.</p>
        </div>
        <ol className="sv-steps">
          {JOURNEY.map((j, i) => (
            <li key={j.title}>
              <a href={j.href} data-cta-location={`SV Journey — ${j.title}`}>
                <span className="sv-step-n">{String(i + 1).padStart(2, "0")}</span>
                <b>{j.title}</b>
                <span>{j.body}</span>
                <span className="sv-step-go">
                  Explore <ArrowIcon />
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const WHY3 = WHY.slice(0, 3);
const countries = TRUST.find((t) => t.label === "Client countries")!;

/* Why us (three points) and the team as published on www.best-solution.ae, shown only when SHOW_TEAM is on. */
export function SvTrust() {
  return (
    <section className="fz-block sv-trust-sec" id="team" aria-labelledby="svTeamTitle">
      <div className={`wrap sv-trust-grid${SHOW_TEAM ? "" : " no-team"}`}>
        <div>
          <p className="fz-tag">
            <span />
            Why Best Solution
          </p>
          <h2 id="svTeamTitle">One team for every stage of your business</h2>
          <p className="sv-trust-lede">
            Emirati-owned and advising since {SITE.founded}, with clients from {countries.count}
            {countries.suffix} countries.
          </p>
          <ol className="sv-why">
            {WHY3.map((w, i) => (
              <li key={w.title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {SHOW_TEAM && (
          <ul className="sv-team">
            {TEAM.map((m) => (
              <li key={m.name}>
                <Image src={m.photo} alt={`${m.name}, ${m.role}, Best Solution`} width={320} height={320} sizes="(max-width: 640px) 50vw, 260px" />
                <b>{m.name}</b>
                <span>{m.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* Closing: callback popup and WhatsApp. */
export function SvClosing() {
  return (
    <section className="fz-close" id="closing" aria-labelledby="closeTitle">
      <div className="wrap">
        <div className="fz-close-in">
          <div>
            <h2 id="closeTitle">Not sure where to start?</h2>
            <p>Tell us what you are planning. A consultant recommends the right service and confirms the costs in writing.</p>
          </div>
          <div className="fz-close-cta">
            <CallbackTrigger className="btn btn-primary" location="SV Closing — Book a Consultation">
              Book a Consultation <ArrowIcon />
            </CallbackTrigger>
            <a className="fz-btn-ghost sv-wa" href={SITE.whatsapp} target="_blank" rel="noopener" data-area="SV Closing">
              <WhatsAppIcon /> WhatsApp us
            </a>
            <p>Complimentary · No obligation · We reply by phone, WhatsApp or email</p>
          </div>
        </div>
      </div>
    </section>
  );
}
