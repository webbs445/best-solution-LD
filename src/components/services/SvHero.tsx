"use client";

import { useState } from "react";
import { SITE, TRUST } from "@/content/site";
import { GOALS, SETUP_OPTIONS, serviceById, type GoalId, type SetupOption } from "@/content/services";
import { HELPER_QUESTIONS, recommend, type HelperAnswers, type Recommendation } from "@/lib/services";
import { formatAED } from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";
import { ArrowIcon, StarIcon } from "@/components/ui/Icons";
import { ServiceIcon } from "./ServiceIcon";

const advised = TRUST.find((t) => t.label === "Businesses advised")!;
const price = (s: { from: number | null; priceNote?: string }) => (s.from !== null ? `From AED ${formatAED(s.from)}${s.priceNote ?? ""}` : s.priceNote);

/* A single service: name, price, free tool and a Go link to its page. */
function ServiceCard({ id, helper }: { id: Exclude<GoalId, "setup">; helper: boolean }) {
  const s = serviceById(id);
  return (
    <div className="sv-card-svc" key={id}>
      <span className="sv-card-ico">
        <ServiceIcon id={id} />
      </span>
      <p className="sv-card-k">{helper ? "We recommend" : "Your service"}</p>
      <h2 className="sv-card-name">{s.name}</h2>
      <p className="sv-card-line">{s.line}</p>
      <dl className="sv-card-facts">
        <div>
          <dt>Starting price</dt>
          <dd>{price(s)}</dd>
        </div>
        <div>
          <dt>Free tool</dt>
          <dd>
            <a href={s.tool.href} data-cta-location={`SV Hero — Tool: ${s.name}`}>
              {s.tool.label}
            </a>
            <span className="sv-chip">2-minute {s.tool.tag}</span>
          </dd>
        </div>
      </dl>
      <a className="btn btn-primary sv-go" href={s.href} data-cta-location={`SV Hero — Go: ${s.name}`}>
        Go to {s.name} <ArrowIcon />
      </a>
    </div>
  );
}

/*
  "Start a company": Mainland and Free zone side by side, each with its price, timing, tool and Go link. Following
  either route reports service_pick with the route as `option`, so free zone picks stay measurable.
*/
function SetupPanel({ recommended }: { recommended?: SetupOption }) {
  const pickRoute = (option: SetupOption) => trackEvent("service_pick", { service: "setup", option });
  return (
    <div className="sv-card-svc" key={`setup-${recommended ?? ""}`}>
      <span className="sv-card-ico">
        <ServiceIcon id="setup" />
      </span>
      <p className="sv-card-k">{recommended ? "We recommend" : "Your service"}</p>
      <h2 className="sv-card-name">Start a company</h2>
      <p className="sv-card-line">Two routes. Choose the one that fits how you trade.</p>
      <div className="sv-opts">
        {SETUP_OPTIONS.map(({ id, label, service: s }) => (
          <div key={id} className={`sv-opt${recommended === id ? " is-rec" : ""}`}>
            <div className="sv-opt-top">
              <h3>{label}</h3>
              {recommended === id && <span className="sv-chip">Recommended</span>}
            </div>
            <p className="sv-opt-price">{price(s)}</p>
            <p className="sv-opt-time">{s.timing}</p>
            <a className="sv-opt-tool" href={s.tool.href} data-cta-location={`SV Hero — Tool: ${label}`} onClick={() => pickRoute(id)}>
              {s.tool.label}
            </a>
            <a className="btn btn-primary sv-opt-go" href={s.href} data-cta-location={`SV Hero — Go: ${label}`} onClick={() => pickRoute(id)}>
              Go to {label} <ArrowIcon />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ r, helper }: { r: Recommendation; helper: boolean }) {
  return r.goal === "setup" ? <SetupPanel recommended={helper ? r.option : undefined} /> : <ServiceCard id={r.goal} helper={helper} />;
}

/* "I'm not sure yet": three questions, one at a time, then the recommendation. */
function Helper({ onReset }: { onReset: () => void }) {
  const [a, setA] = useState<HelperAnswers>({});
  const pick = recommend(a);
  if (pick) {
    return (
      <>
        <Panel r={pick} helper />
        <button type="button" className="sv-again" onClick={() => setA({})}>
          Answer again
        </button>
      </>
    );
  }
  // With all three answered, recommend() returns a goal and the panel above replaces the questions.
  const step = !a.stage ? 0 : !a.focus ? 1 : 2;
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
              if (r) trackEvent("service_recommend", { service: r.goal, option: r.option });
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
  const [goal, setGoal] = useState<GoalId | "unsure">("setup");
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
          {goal === "unsure" ? <Helper onReset={() => setGoal("setup")} /> : <Panel r={{ goal }} helper={false} />}
        </div>
      </div>
    </section>
  );
}
