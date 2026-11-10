import Image from "next/image";
import { CLAIMS, SITE, WHY, claimText } from "@/content/site";
import { JOURNEY, SERVICES, SHOW_TEAM, TEAM, type ServiceId } from "@/content/services";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { CallbackLink, CallbackTrigger } from "@/components/freezone/CallbackTrigger";
import { ServiceIcon } from "./ServiceIcon";

/* The /services page's static sections. Server components: no client JavaScript. Advice only: no prices or timings. */

/*
  The hub: one tile per service, each opening its own page (two large, three medium, two large), then the wide
  "Not sure where to begin?" band, which opens the consultation pop-up.
*/
export function SvGrid() {
  return (
    <section className="fz-block sv-grid-sec" id="services" aria-labelledby="svGridTitle">
      <div className="wrap">
        <div className="fz-head-split sv-grid-head">
          <p className="fz-tag">
            <span />
            Our services
          </p>
          <h2 id="svGridTitle">{claimText("oneAdvisor", "Every service, one advisor", "Every service, explained clearly")}</h2>
          <p>Pick a service to see how we can help. Each one has its own page.</p>
        </div>
        <ul className="sv-grid">
          {SERVICES.map((s) => (
            // The whole tile opens the service page (stretched link); the tool tag is its own link to the tool.
            <li key={s.id} className={s.big ? "big" : "mid"}>
              <article className="sv-tile spot">
                {s.photo && (
                  <>
                    <Image className="sv-tile-photo" src={s.photo} alt="" fill sizes="(max-width: 640px) 100vw, 560px" />
                    <span className="sv-tile-shade" aria-hidden="true" />
                  </>
                )}
                <span className="sv-tile-ico">
                  <ServiceIcon id={s.id} />
                </span>
                {s.big && s.tool && (
                  <a className="sv-chip sv-tile-tool" href={s.tool.href} data-cta-location={`SV Grid - Tool: ${s.tool.text}`}>
                    {s.tool.text}
                  </a>
                )}
                <h3>
                  <a className="sv-tile-main" href={s.href} data-service-card={s.name}>
                    {s.name}
                  </a>
                </h3>
                <p>{s.line}</p>
                {!s.big && s.tool && (
                  <a className="sv-tile-toollink" href={s.tool.href} data-cta-location={`SV Grid - Tool: ${s.tool.text}`}>
                    {s.tool.text} <ArrowIcon />
                  </a>
                )}
                <span className="sv-tile-foot">
                  <b>Explore</b>
                  <span className="sv-tile-go" aria-hidden="true">
                    <ArrowIcon />
                  </span>
                </span>
              </article>
            </li>
          ))}
          <li className="wide">
            <CallbackLink className="sv-banner" location="SV Grid - Not sure where to begin">
              <span className="sv-banner-ico">
                <ServiceIcon id="setup" />
              </span>
              <span className="sv-banner-txt">
                <small>Not sure where to begin?</small>
                <b>Talk it through with an advisor</b>
                <span>Talk it through with an advisor, in person or by video call, at a time that suits you. No obligation.</span>
              </span>
              <span className="sv-banner-cta">
                Book a Consultation <ArrowIcon />
              </span>
            </CallbackLink>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* "How we help": five stages on one copper path, each opening the page that serves it. */
const STAGE_ICONS: ServiceId[] = ["setup", "calculator", "accounting", "tax", "spv"];
export function SvJourney() {
  return (
    <section className="fz-block sv-journey" id="journey" aria-labelledby="svJourneyTitle">
      <div className="wrap">
        <div className="fz-head-split sv-grid-head">
          <p className="fz-tag">
            <span />
            How we help
          </p>
          <h2 id="svJourneyTitle">Advice as your business grows</h2>
          <p>Tap a stage to see how an advisor can help.</p>
        </div>
        <ol className="sv-steps sv-path">
          {JOURNEY.map((j, i) => (
            <li key={j.title}>
              <a href={j.href} data-cta-location={`SV Journey - ${j.title}`}>
                <span className="sv-node" aria-hidden="true">
                  <ServiceIcon id={STAGE_ICONS[i]} />
                </span>
                <small className="sv-step-k">Step {String(i + 1).padStart(2, "0")}</small>
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
/* One line icon per point: a consultant, a written fee, a team of specialists. */
const WHY_ICONS = [
  "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7",
  "M6 3h9l4 4v14H6zM9 12h7M9 16h5M14 3v5h5",
  "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M15 15c3.3 0 6 2 6 5",
];
/* Confirmed claims only (content/site CLAIMS); nothing is rendered while they are unconfirmed. */
const TRUST_LINE = [CLAIMS.ownership, CLAIMS.since, CLAIMS.countries].filter(Boolean).join(" · ");

/* Why us: the pitch and a consultation button on the left, three points (and the team, when SHOW_TEAM is on) on the right. */
export function SvTrust() {
  return (
    <section className="fz-block sv-trust-sec" id="team" aria-labelledby="svTeamTitle">
      <div className={`wrap sv-trust-grid${SHOW_TEAM ? "" : " no-team"}`}>
        <div>
          <p className="fz-tag">
            <span />
            Why Best Solution
          </p>
          <h2 id="svTeamTitle">One team to talk your plans through</h2>
          <p className="sv-trust-lede">A private consultancy in Business Bay, Dubai.{CLAIMS.oneAdvisor && " One advisor stays your point of contact."}</p>
          {TRUST_LINE && <p className="sv-trust-lede">{TRUST_LINE}</p>}
          <CallbackTrigger className="btn btn-primary sv-why-cta" location="SV Why - Book a Consultation">
            Book a Consultation <ArrowIcon />
          </CallbackTrigger>
        </div>
        <div className="sv-why-side">
          <ol className="sv-why">
            {WHY3.map((w, i) => (
              <li key={w.title}>
                <span className="sv-why-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={WHY_ICONS[i]} />
                  </svg>
                </span>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </div>
              </li>
            ))}
          </ol>
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
            <h2 id="closeTitle">Not sure which service fits?</h2>
            <p>Tell us what you are planning. An advisor suggests where to begin{claimText("writtenFees", " and confirms any fees in writing.", ".")}</p>
          </div>
          <div className="fz-close-cta">
            <CallbackTrigger className="btn btn-primary" location="SV Closing - Book a Consultation">
              Book a Consultation <ArrowIcon />
            </CallbackTrigger>
            <a className="fz-btn-ghost sv-wa" href={SITE.whatsapp} target="_blank" rel="noopener" data-area="SV Closing">
              <WhatsAppIcon /> WhatsApp us
            </a>
            <p>No obligation · We reply by phone, WhatsApp or email</p>
          </div>
        </div>
      </div>
    </section>
  );
}
