import type { Metadata } from "next";
import Image from "next/image";
import { MAPS_URL, REVIEWS, SITE } from "@/content/site";
import { SERVICES } from "@/content/services";
import {
  CARDS,
  FORM_COPY,
  OUTCOMES,
  SAFETY_LINE,
  STEPS,
  TRUST,
  WORRIES,
  XS_DISCLAIMER,
  XS_FACTS,
  XS_FAQS,
  XS_FOOTER_LEGAL,
  type IconId,
} from "@/content/xservicesx";
import { SERVICE_ICON_PATHS } from "@/components/services/ServiceIcon";
import { ReviewAvatar } from "@/components/ui/ReviewAvatar";
import { ArrowIcon, CheckIcon, ChecklistIcon, PinIcon, PhoneIcon, ReceiptIcon, StarIcon, StructureIcon, TimerIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { SvHeader } from "@/components/services/SvHeader";
import { FzFooter } from "@/components/freezone/FzFooter";
import { MobileEstimateBar } from "@/components/ui/MobileEstimateBar";
import { PlanForm } from "@/components/xservicesx/PlanForm";
import { PlanSheet } from "@/components/xservicesx/PlanSheet";
import "@/app/freezone/freezone.css";
import "@/app/services/services.css";
import "./xservicesx.css";

const TITLE = "Make the Right Call on Your UAE Company | Best Solution";
const DESCRIPTION =
  "Free zone or mainland? What will it cost after year one? Tell us your plan and get a clear, written answer from a Dubai advisor. First consultation free.";

// noindex comes from the root layout (robots) and the X-Robots-Tag header, as on every page of this subdomain.
// Reachable by URL only: no nav link, no sitemap.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://business.best-solution.ae/xservicesx" },
  openGraph: { type: "website", siteName: SITE.name, title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SITE.ogImage] },
};

const HELP_ICON = "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01";
function Ico({ id }: { id: IconId }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={id === "help" ? HELP_ICON : SERVICE_ICON_PATHS[id]} />
    </svg>
  );
}

/** Every "Get my free plan" button: opens the pop-up form (components/xservicesx/PlanSheet), with the safety line under it. */
function PlanButton({ loc, need, label = "Get my free plan", card }: { loc: string; need?: string; label?: string; card?: boolean }) {
  return (
    <div className="xs-cta">
      <button
        type="button"
        className="btn btn-primary"
        aria-controls="cbModal"
        aria-haspopup="dialog"
        data-cta-location={loc}
        data-need={need}
        data-service-card={card ? need : undefined}
      >
        {label} <ArrowIcon />
      </button>
      <small>{SAFETY_LINE}</small>
    </div>
  );
}

function WhatsAppButton({ loc, label = "Ask on WhatsApp" }: { loc: string; label?: string }) {
  return (
    <a className="fz-btn-ghost xs-wa" href={SITE.whatsapp} target="_blank" rel="noopener" data-cta-location={loc}>
      <WhatsAppIcon /> {label}
    </a>
  );
}

const MICHAEL = REVIEWS.find((r) => r.name === "Michael");
const OUTCOME_ICONS = [<StructureIcon key="s" />, <ReceiptIcon key="r" />, <ChecklistIcon key="c" />, <TimerIcon key="t" />, <CheckIcon key="k" />];
/** Reviews longer than this fold on phones behind "Read more". */
const FOLD_AT = 110;

export default function XServicesPage() {
  const heroFacts = ["Free, no obligation", "In person or by video", ...(XS_FACTS.replyTime ? [`Reply ${XS_FACTS.replyTime}`] : [])];
  const adv = XS_FACTS.advisor;
  const story = XS_FACTS.clientStory;
  return (
    <div className="fz-page sv-page xs-page">
      <a className="skip-link" href="#plan">
        Skip to the form
      </a>
      <SvHeader cta="Get my free plan" prefix="XS" />
      <main id="top">
        {/* 1 · First screen */}
        <section className="xs-hero" id="hero" aria-labelledby="xsTitle">
          <div className="wrap xs-hero-grid">
            <div className="xs-hero-copy">
              <p className="fz-tag">
                <span />
                Private business advisors in Business Bay, Dubai
              </p>
              <h1 id="xsTitle">Make the right call on your UAE company, before you spend a dirham.</h1>
              <p className="xs-lede">
                Free zone or mainland? Which costs come after year one? Tell us your plan, and an advisor gives you a clear answer,
                in writing. Your first consultation is free.
              </p>
              <div className="xs-btns">
                <PlanButton loc="XS Hero - Get my free plan" />
                <WhatsAppButton loc="XS Hero - Ask on WhatsApp" />
              </div>
              <ul className="xs-facts">
                {heroFacts.map((f) => (
                  <li key={f}>
                    <CheckIcon /> {f}
                  </li>
                ))}
              </ul>
              {XS_FACTS.heroQuote && MICHAEL && (
                <figure className="xs-proof">
                  <span className="xs-stars" role="img" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </span>
                  <blockquote data-review-quote>&ldquo;{XS_FACTS.heroQuote}&rdquo;</blockquote>
                  <figcaption>
                    {MICHAEL.name}, CEO, {MICHAEL.company}
                  </figcaption>
                </figure>
              )}
              <p className="fz-disclaimer xs-disclaimer" role="note" data-legal>
                {XS_DISCLAIMER}
              </p>
            </div>
            <div className="xs-card xs-hero-form">
              <h2>{FORM_COPY.title}</h2>
              <p className="xs-form-line">{FORM_COPY.line}</p>
              <PlanForm idPrefix="xs-hero" />
            </div>
          </div>
        </section>

        {/* 2 · Sound familiar? */}
        <section className="xs-block xs-worries" id="worries" aria-labelledby="xsWorries">
          <div className="wrap">
            <h2 id="xsWorries">Sound familiar?</h2>
            <ul className="xs-worry-list">
              {WORRIES.map((w) => (
                <li key={w}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 7l10 10M17 7 7 17" />
                  </svg>
                  {w}
                </li>
              ))}
            </ul>
            <p className="xs-promise">
              <b>That&rsquo;s exactly what we sort out with you, in one conversation, before you commit to anything.</b>
              <a href="#situations" className="xs-down" aria-label="Where are you right now?">
                <ArrowIcon />
              </a>
            </p>
          </div>
        </section>

        {/* 3 · Pick your situation */}
        <section className="xs-block xs-sit" id="situations" aria-labelledby="xsSit">
          <div className="wrap">
            <div className="xs-head">
              <h2 id="xsSit">Where are you right now?</h2>
              <p>Pick the one closest to you. We&rsquo;ll take it from there.</p>
            </div>
            <ul className="xs-cards">
              {CARDS.map((c, i) => (
                <li key={c.need} className="xs-sit-card xs-fold">
                  <h3 className="xs-desk">
                    <span className="xs-ico">
                      <Ico id={c.icon} />
                    </span>
                    {c.title}
                  </h3>
                  <h3 className="xs-phone">
                    <button type="button" className="xs-tog" data-fold aria-expanded="false" aria-controls={`xs-card-${i}`}>
                      <span className="xs-ico">
                        <Ico id={c.icon} />
                      </span>
                      {c.title}
                    </button>
                  </h3>
                  <div className="xs-fold-body" id={`xs-card-${i}`}>
                    <dl>
                      <dt>Who it&rsquo;s for</dt>
                      <dd>{c.who}</dd>
                      <dt>What you&rsquo;ll get</dt>
                      <dd>{c.get}</dd>
                    </dl>
                    <PlanButton loc={`XS Card - ${c.need}`} need={c.need} label={c.button} card />
                    {c.links.length > 0 && (
                      <p className="xs-more">
                        {c.links.map((l) => (
                          <a key={l.href} href={l.href} data-cta-location={`XS Card - ${c.need} - ${l.href}`}>
                            {l.label}
                          </a>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4 · In one free consultation, you'll know */}
        <section className="xs-block xs-know" id="outcomes" aria-labelledby="xsKnow">
          <div className="wrap">
            <h2 id="xsKnow">In one free consultation, you&rsquo;ll know</h2>
            <ol className="xs-outcomes">
              {OUTCOMES.map(([b, rest], i) => (
                <li key={b}>
                  <span className="xs-ico">{OUTCOME_ICONS[i]}</span>
                  <span>
                    <b>{b}</b>
                    {rest}
                  </span>
                </li>
              ))}
            </ol>
            <p className="xs-reassure">No pressure to buy anything. If we&rsquo;re not the right fit, we&rsquo;ll tell you.</p>
            <PlanButton loc="XS Outcomes - Get my free plan" />
          </div>
        </section>

        {/* 5 · How it works */}
        <section className="xs-block xs-how" id="how" aria-labelledby="xsHow">
          <div className="wrap">
            <h2 id="xsHow">Three steps. No surprises.</h2>
            <ol className="xs-steps">
              {STEPS.map(([b, rest], i) => (
                <li key={b}>
                  <span className="xs-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <p>
                    <b>{b}</b> {rest}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6 · Meet your advisor */}
        <section className="xs-block xs-people" id="advisor" aria-labelledby="xsPeople">
          <div className="wrap">
            <h2 id="xsPeople">Meet the people you&rsquo;ll talk to</h2>
            <div className={`xs-people-grid${adv ? "" : " no-adv"}`}>
              {adv && (
                <figure className="xs-card xs-adv">
                  <Image src={adv.photo} alt={adv.name} width={96} height={96} />
                  <figcaption>
                    <b>
                      {adv.name}, {adv.role}
                    </b>
                    <span>Speaks {adv.languages}</span>
                    <q>{adv.sentence}</q>
                    <a href={SITE.whatsapp} target="_blank" rel="noopener" data-cta-location="XS Advisor - WhatsApp">
                      <WhatsAppIcon /> Message {adv.name} on WhatsApp
                    </a>
                  </figcaption>
                </figure>
              )}
              <div>
                <h3>Why people trust us</h3>
                <ul className="xs-trust">
                  {TRUST.map(([b, rest]) => (
                    <li key={b}>
                      <CheckIcon />
                      <span>
                        <b>{b}</b>
                        {rest}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 7 · What clients say */}
        <section className="xs-block xs-reviews" id="reviews" aria-labelledby="xsRev">
          <div className="wrap">
            <div className="xs-head">
              <h2 id="xsRev">What clients say</h2>
              {XS_FACTS.rating && <p>{XS_FACTS.rating}</p>}
            </div>
            <ul className="xs-rev-row">
              {REVIEWS.map((r, i) => (
                <li key={r.name} className={`xs-card xs-rev xs-fold${r.quote.length > FOLD_AT ? " can-fold" : ""}`}>
                  <blockquote lang={r.lang} data-review-quote className="xs-fold-clamp" id={`xs-rev-${i}`}>
                    &ldquo;{r.quote}&rdquo;
                  </blockquote>
                  {r.quote.length > FOLD_AT && (
                    <button type="button" className="xs-read" data-fold aria-expanded="false" aria-controls={`xs-rev-${i}`}>
                      Read more
                    </button>
                  )}
                  <figure className="xs-rev-by">
                    <ReviewAvatar r={r} className="t-photo" />
                    <figcaption>
                      <b>{r.name}</b>
                      {[r.role, r.company].filter(Boolean).join(", ")}
                      <em>Google review</em>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            {story && (
              <div className="xs-card xs-story xs-fold">
                <p>{story.situation}</p>
                <button type="button" className="xs-read" data-fold aria-expanded="false" aria-controls="xs-story">
                  Read more
                </button>
                <div className="xs-fold-body" id="xs-story">
                  <p>{story.advice}</p>
                  <p>{story.result}</p>
                </div>
              </div>
            )}
            <div className="xs-rev-foot">
              <p>Want the same clarity?</p>
              <PlanButton loc="XS Reviews - Get my free plan" />
              <a className="t-all" href={SITE.googleReviews} target="_blank" rel="noopener">
                Read all Google reviews <ArrowIcon />
              </a>
            </div>
          </div>
        </section>

        {/* 8 · Questions, then the last step */}
        <section className="xs-block xs-end" id="faq" aria-labelledby="xsFaq">
          <div className="wrap xs-end-grid">
            <div>
              <h2 id="xsFaq">Questions people ask before they call</h2>
              <div className="xs-faq">
                {XS_FAQS.map((f) => (
                  <details key={f.q} data-faq-question={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="xs-final" id="plan">
              <h2>Leave your first call knowing exactly what to do, and what it will cost.</h2>
              <p className="xs-lede">Free. No obligation. Fees in writing before any work starts.</p>
              <div className="xs-card">
                <h3>{FORM_COPY.title}</h3>
                <p className="xs-form-line">{FORM_COPY.line}</p>
                <PlanForm idPrefix="xs-end" />
              </div>
              <ul className="xs-contact">
                <li>
                  <WhatsAppButton loc="XS Final - Ask on WhatsApp" />
                </li>
                {XS_FACTS.callNumber && (
                  <li>
                    <a href={XS_FACTS.callNumber.href} data-cta-location="XS Final - Call">
                      <PhoneIcon /> Call {XS_FACTS.callNumber.display}
                    </a>
                  </li>
                )}
                <li>{SITE.hours.long}</li>
                <li>
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                    <PinIcon /> Business Bay, Dubai
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <FzFooter
        blurb="Business advice from a private consultancy in Business Bay, Dubai."
        nav={SERVICES.map((s) => ({ href: s.href, label: s.name }))}
        navLabel="Services"
        legal={XS_FOOTER_LEGAL}
        cta={
          <div className="f5-cta">
            <h4>{FORM_COPY.title}</h4>
            <p>{FORM_COPY.line}</p>
            <PlanButton loc="XS Footer - Get my free plan" />
          </div>
        }
      />
      <PlanSheet />
      <MobileEstimateBar targetId="plan" hideOver={["hero"]} location="XS Mobile Bar - Get my free plan" label="Get my free plan" callback />
    </div>
  );
}
