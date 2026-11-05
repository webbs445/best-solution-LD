"use client";

import { useState } from "react";
import { SITE, TRUST } from "@/content/site";
import { GOALS, serviceById, type ServiceId } from "@/content/services";
import { HELPER_QUESTIONS, recommend, type HelperAnswers } from "@/lib/services";
import { formatAED } from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { ServiceIcon } from "./ServiceIcon";

const TAG_LABEL = { calculator: "calculator", planner: "planner", quote: "quote", estimator: "estimator" } as const;
const advised = TRUST.find((t) => t.label === "Businesses advised")!;

/* The service a goal (or the helper) points to: name, price, free tool and a Go link to its page. */
function ServiceCard({ id, from }: { id: ServiceId; from: "picker" | "helper" }) {
  const s = serviceById(id);
  return (
    <div className="sv-card-svc" key={id}>
      <span className="sv-card-ico">
        <ServiceIcon id={id} />
      </span>
      <p className="sv-card-k">{from === "helper" ? "We recommend" : "Your service"}</p>
      <h2 className="sv-card-name">{s.name}</h2>
      <p className="sv-card-line">{s.line}</p>
      <dl className="sv-card-facts">
        <div>
          <dt>Starting price</dt>
          <dd>{s.from !== null ? `From AED ${formatAED(s.from)}${s.priceNote ?? ""}` : s.priceNote}</dd>
        </div>
        <div>
          <dt>Free tool</dt>
          <dd>
            <a href={s.tool.href} data-cta-location={`SV Hero — Tool: ${s.name}`}>
              {s.tool.label}
            </a>
            <span className="sv-chip">2-minute {TAG_LABEL[s.tool.tag]}</span>
          </dd>
        </div>
      </dl>
      <a className="btn btn-primary sv-go" href={s.href} data-cta-location={`SV Hero — Go: ${s.name}`}>
        Go to {s.name} <ArrowIcon />
      </a>
    </div>
  );
}

/* "Not sure": three questions, one at a time, then the recommended service. */
function Helper({ onReset }: { onReset: () => void }) {
  const [a, setA] = useState<HelperAnswers>({});
  // With all three answered, recommend() returns a service and the card below replaces the questions.
  const step = !a.stage ? 0 : !a.focus ? 1 : 2;
  const pick = recommend(a);
  if (pick) {
    return (
      <>
        <ServiceCard id={pick} from="helper" />
        <button type="button" className="sv-again" onClick={() => setA({})}>
          Answer again
        </button>
      </>
    );
  }
  const qd = HELPER_QUESTIONS[step];
  const q = typeof qd.q === "function" ? qd.q(a) : qd.q;
  const options = typeof qd.options === "function" ? qd.options(a) : qd.options;
  return (
    <div className="sv-helper" key={step}>
      <div className="sv-helper-top">
        <p className="sv-card-k">Question {step + 1} of 3</p>
        <ol className="sv-dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className={i <= step ? "on" : undefined} />
          ))}
        </ol>
      </div>
      <h2 className="sv-card-name" id="svHelperQ">
        {q}
      </h2>
      <div className="sv-helper-opts" role="group" aria-labelledby="svHelperQ">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => {
              const next = { ...a, [qd.key]: o.v } as HelperAnswers;
              setA(next);
              const r = recommend(next);
              if (r) trackEvent("service_recommend", { service: r });
            }}
          >
            {o.label}
            <ArrowIcon />
          </button>
        ))}
      </div>
      <button type="button" className="sv-again" onClick={step ? () => setA({}) : onReset}>
        {step ? "Start again" : "Back to the services"}
      </button>
    </div>
  );
}

export function SvHero() {
  const [goal, setGoal] = useState<ServiceId | "unsure">("setup");
  return (
    <section className="fz-hero sv-hero" aria-labelledby="svTitle">
      <div className="fz-hero-bg" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="wrap fz-hero-grid sv-hero-grid">
        <div>
          <p className="fz-tag">
            <span />
            Best Solution services
          </p>
          <h1 id="svTitle">
            What do you want to do <span className="accent">in the UAE?</span>
          </h1>
          <p className="fz-sub">Pick a goal. We show you the service, its starting price and a free tool to begin with.</p>
          <div className="sv-goals" role="group" aria-label="Your goal">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={goal === g.id}
                aria-controls="svPanel"
                onClick={() => {
                  setGoal(g.id);
                  trackEvent("service_pick", { service: g.id });
                }}
              >
                {g.id !== "unsure" && <ServiceIcon id={g.id} />}
                {g.label}
              </button>
            ))}
          </div>
          <ul className="sv-trust">
            <li>
              <span className="sv-stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon key={i} />
                ))}
              </span>
              <b>{SITE.rating.score}</b> from {SITE.rating.count}+ Google reviews
            </li>
            <li>
              Advising since <b>{SITE.founded}</b>
            </li>
            <li>
              <b>
                {advised.count.toLocaleString("en-US")}
                {advised.suffix}
              </b>{" "}
              businesses advised
            </li>
          </ul>
        </div>
        <div className="sv-card spot" id="svPanel" aria-live="polite">
          {goal === "unsure" ? <Helper onReset={() => setGoal("setup")} /> : <ServiceCard id={goal} from="picker" />}
        </div>
      </div>
    </section>
  );
}
