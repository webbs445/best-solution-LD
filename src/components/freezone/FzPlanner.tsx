"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EMIRATES, PLANNER_ACTS, PRIORITIES, ZONES, ZONE_BY_ID, ACT_LABEL, type Priority } from "@/content/freezone";
import { SITE } from "@/content/site";
import { FZ_FORM_ID } from "@/lib/lead";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { ConsultForm } from "@/components/consult/ConsultForm";
import { FZ_GO_PLANNER, MAX_SHAREHOLDERS, MAX_TEAM, usePlanner } from "./PlannerProvider";
import { ZoneLogo } from "./ZoneLogo";
import s from "./FzPlanner.module.css";

/*
  The free zone planner on a dark stage, in two screens. Advice only (Google Ads policy): no prices or residency.
  1. Plan: what the business does, what matters most and the team, then the best-matching zones.
     Desktop shows it all at once; phones go one step at a time with the finished steps stacked as cards.
  2. Advisor: the chosen zone and shortlist, with the consultation form (the planner's form id, so conversion
     history continues).
*/

/* Zones for the "any of the 28" select, grouped by emirate, A to Z. */
const GROUPS = EMIRATES.map((em) => ({ em, zones: ZONES.filter((zn) => zn.emirate === em).sort((a, b) => a.name.localeCompare(b.name)) }));

const STEP_NAMES = ["Activities", "Priority", "Team", "Matches"];
const PHONE = "(max-width: 760px)";
const two = (n: number) => String(n).padStart(2, "0");

const PRI_INFO: Record<Priority, { desc: string; icon: ReactNode }> = {
  range: {
    desc: "Zones that cover many activities come first",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  dubai: {
    desc: "Zones in Dubai come first",
    icon: (
      <>
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
  },
  sector: {
    desc: "Zones built around your sector come first",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
  },
};

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const BACK_ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

function Counter({ label, help, value, min, max, names, onStep }: { label: string; help: string; value: number; min: number; max: number; names: [string, string]; onStep: (d: 1 | -1) => void }) {
  return (
    <div className={s.counter} role="group" aria-label={label}>
      <span className={s.counterText}>
        <b>{label}</b>
        <small>{help}</small>
      </span>
      <div className={s.counterRow}>
        <button type="button" aria-label={names[0]} disabled={value <= min} onClick={() => onStep(-1)}>
          &minus;
        </button>
        <output aria-live="polite" key={value}>
          {value}
        </output>
        <button type="button" aria-label={names[1]} disabled={value >= max} onClick={() => onStep(1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function FzPlanner() {
  const { state, matches, toggleAct, setPriority, step: count, chooseZone } = usePlanner();
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<"plan" | "advisor">("plan");
  // Phones only: which of the four planning steps is showing, and which way the last move went (for the slide).
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const select = useRef<HTMLSelectElement>(null);

  const zone = ZONE_BY_ID[state.zone];
  const onAdvisor = view === "advisor";

  const toTop = () => {
    const top = stage.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) stage.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    toTop();
  };
  const toAdvisor = () => {
    setDir(1);
    setView("advisor");
    toTop();
  };
  const backToPlan = () => {
    setDir(-1);
    setView("plan");
    setStep(3);
    toTop();
  };

  // A zone handed over from the explorer opens the advisor screen with that zone.
  useEffect(() => {
    const open = () => {
      setDir(1);
      setView("advisor");
    };
    window.addEventListener(FZ_GO_PLANNER, open);
    return () => window.removeEventListener(FZ_GO_PLANNER, open);
  }, []);

  const pickPriority = (v: Priority) => {
    setPriority(v);
    // Phones: a tap on a priority moves straight on to the team step.
    if (window.matchMedia(PHONE).matches) window.setTimeout(() => go(2), prefersReducedMotion() ? 0 : 260);
  };
  const openAll = () => {
    setShowAll(true);
    requestAnimationFrame(() => select.current?.focus());
  };

  const actNames = state.acts.map((a) => ACT_LABEL[a]);
  const priIdx = Math.max(0, PRIORITIES.findIndex((p) => p.v === state.pri));
  const teamText = `${state.team} ${state.team === 1 ? "person" : "people"} in the team`;
  const shText = `${state.sh} ${state.sh === 1 ? "shareholder" : "shareholders"}`;
  const others = matches.filter((m) => m.zone.id !== state.zone).map((m) => m.zone.name);
  const done = [
    { label: "Activities", value: actNames.join(", ") },
    { label: "Priority", value: PRIORITIES[priIdx].label },
    { label: "Team", value: `${teamText} · ${shText}` },
  ].slice(0, step);
  const canNext = step === 0 ? state.acts.length > 0 : true;
  const pane = (n: number) => `${s.pane}${n === step ? ` ${s.on}` : ""}`;
  // The visitor's choices go into the message box, where they can edit or clear them before sending.
  const plan = [
    `Free zone: ${zone.name}`,
    actNames.length ? `Activities: ${actNames.join(", ")}` : "",
    `Priority: ${PRIORITIES[priIdx].label}`,
    `${teamText}, ${shText}`,
    others.length ? `Also comparing: ${others.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <section className="fz-block" id="planner" aria-labelledby="plTitle">
      <span id="finder" className="fz-anchor" />
      <div className="wrap">
        <div ref={stage} className={s.stage} data-dir={dir > 0 ? "fwd" : "back"}>
          <div className={s.glow} aria-hidden="true">
            <i />
            <i />
          </div>

          <div className={s.head}>
            <div>
              <span className={s.eyebrow}>Free zone planner</span>
              <h2 id="plTitle">{onAdvisor ? "Talk your shortlist through with an advisor" : "Plan your free zone in one screen"}</h2>
            </div>
            <span className={s.pill}>{ZONES.length} free zones · No obligation</span>
          </div>

          {onAdvisor ? (
            /* ---------- Screen 2: the advisor ---------- */
            <div className={s.est} id="consultation-form">
              <button type="button" className={s.estBack} onClick={backToPlan}>
                {BACK_ARROW} Change zone or answers
              </button>
              <div className={s.estGrid}>
                <div className={s.estHero}>
                  <span className={s.costLabel}>Your shortlist</span>
                  <div className={s.estZone}>
                    <ZoneLogo zone={zone} size="zl-sug" />
                    <span>
                      <b>{zone.name}</b>
                      <small>{zone.emirate}</small>
                    </span>
                  </div>
                  <p className={s.adviceText}>{zone.d}</p>
                  <ul className={s.estTags}>
                    {actNames.length ? <li>{actNames.join(", ")}</li> : null}
                    <li>{PRIORITIES[priIdx].label}</li>
                    <li>{teamText}</li>
                    <li>{shText}</li>
                  </ul>
                  {others.length ? (
                    <>
                      <span className={s.costLabel}>Also worth comparing</span>
                      <ul className={s.otherList}>
                        {others.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <div className={s.estNext}>
                    <p>Your advisor checks your exact activity and talks you through the zones that may suit you.</p>
                    <a className={s.wa} href={SITE.whatsapp} target="_blank" rel="noopener" data-area="FZ Planner">
                      <WhatsAppIcon /> Message an advisor
                    </a>
                  </div>
                  <span className={s.shine} aria-hidden="true" />
                </div>
                <div className={s.formCard}>
                  <ConsultForm key={plan} formId={FZ_FORM_ID} formType="calculator" idPrefix="fz" message={plan} />
                </div>
              </div>
            </div>
          ) : (
            /* ---------- Screen 1: the plan ---------- */
            <>
              {/* Phones: the step counter, progress and the finished steps as stacked cards. */}
              <div className={s.phoneTop}>
                <p className={s.count} aria-live="polite">
                  Step {two(step + 1)} / 04 · {STEP_NAMES[step]}
                </p>
                <div className={s.progress} aria-hidden="true">
                  {STEP_NAMES.map((n, i) => (
                    <span key={n}>
                      <i style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} />
                    </span>
                  ))}
                </div>
                {done.length ? (
                  <ol className={s.stack}>
                    {done.map((d, i) => (
                      <li key={d.label} style={{ "--depth": done.length - 1 - i, zIndex: i + 1 } as CSSProperties}>
                        <span className={s.stackTick}>{CHECK}</span>
                        <span className={s.stackText}>
                          <small>{d.label}</small>
                          <b>{d.value}</b>
                        </span>
                        <button type="button" onClick={() => go(i)} aria-label={`Edit ${d.label.toLowerCase()}`}>
                          Edit
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>

              <div className={s.grid}>
                <div className={s.business}>
                  {/* 1. Activities */}
                  <div className={pane(0)}>
                    <div className={s.qRow}>
                      <h3 className={s.q}>
                        <span className={s.qLong}>What will your business do?</span>
                        <span className={s.qShort}>What will you do?</span>
                      </h3>
                      <span className={s.counterPill}>{state.acts.length} / 3 chosen</span>
                    </div>
                    <div className={`${s.acts}${state.acts.length >= 3 ? ` ${s.full}` : ""}`} role="group" aria-label="Business activities, pick up to 3">
                      {PLANNER_ACTS.map((a, i) => {
                        const on = state.acts.includes(a.v);
                        return (
                          <button key={a.v} type="button" aria-pressed={on} onClick={() => toggleAct(a.v)} style={{ "--i": i } as CSSProperties}>
                            <span className={s.actIco}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: a.icon }} />
                            </span>
                            <span className={s.actLabel}>{a.label}</span>
                            {on ? <span className={s.tick}>{CHECK}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Priority */}
                  <div className={pane(1)}>
                    <h3 className={s.q}>
                      <span className={s.qLong}>What matters most to you?</span>
                      <span className={s.qShort}>What matters most?</span>
                    </h3>
                    <p className={s.phoneHint}>We rank the {ZONES.length} free zones around it.</p>
                    <div className={s.pri} role="group" aria-label="What matters most" style={{ "--x": `${priIdx * 100}%` } as CSSProperties}>
                      <span className={s.priSlide} aria-hidden="true" />
                      {PRIORITIES.map((p, i) => (
                        <button key={p.v} type="button" aria-pressed={state.pri === p.v} onClick={() => pickPriority(p.v)} style={{ "--i": i } as CSSProperties}>
                          <span className={s.priIco}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              {PRI_INFO[p.v].icon}
                            </svg>
                          </span>
                          <span className={s.priText}>
                            <b>{p.label}</b>
                            <small>{PRI_INFO[p.v].desc}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Team */}
                  <div className={pane(2)}>
                    <h3 className={s.q}>
                      <span className={s.qLong}>Tell us about your team</span>
                      <span className={s.qShort}>Your team</span>
                    </h3>
                    <div className={`${s.team} ${s.team2}`}>
                      <Counter label="Team" help="People working in the business" value={state.team} min={1} max={MAX_TEAM} names={["Fewer people", "More people"]} onStep={(d) => count("team", d)} />
                      <Counter label="Shareholders" help="Owners of the company" value={state.sh} min={1} max={MAX_SHAREHOLDERS} names={["Fewer shareholders", "More shareholders"]} onStep={(d) => count("sh", d)} />
                    </div>
                    <small className={s.hint}>Your advisor confirms what each zone allows for your team and activities.</small>
                  </div>

                  {/* Phones: Back / Continue under each of the first three steps. */}
                  {step < 3 ? (
                    <div className={s.nav}>
                      {step > 0 ? (
                        <button type="button" className={s.back} onClick={() => go(step - 1)} aria-label="Back">
                          {BACK_ARROW}
                        </button>
                      ) : null}
                      <button type="button" className={s.next} onClick={() => canNext && go(step + 1)} aria-disabled={!canNext}>
                        {step === 2 ? "See my matches" : "Continue"} {ARROW}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* 4. Matches: pick a zone, then talk it through with an advisor */}
                <div className={`${s.results} ${pane(3)}`}>
                  <div className={s.resHead}>
                    <div>
                      <h3 className={s.resTitle}>Your top matches</h3>
                      <p>{actNames.length ? `Ranked for ${actNames.join(", ")}. Pick one to talk through.` : "Pick an activity to rank the zones for you."}</p>
                    </div>
                    {showAll ? null : (
                      <button type="button" className={s.linkBtn} onClick={openAll}>
                        Choose from all {ZONES.length} zones
                      </button>
                    )}
                  </div>

                  <ol className={s.matches} aria-live="polite">
                    {matches.map((m, i) => {
                      const tag = !m.fits ? "Partial fit" : i === 0 ? "Top match" : "Also fits";
                      const on = m.zone.id === state.zone;
                      return (
                        <li key={`${m.zone.id}-${state.acts.join()}-${state.pri}`} style={{ "--i": i } as CSSProperties}>
                          <button type="button" aria-pressed={on} onClick={() => chooseZone(m.zone.id, "match")}>
                            <span className={s.mTop}>
                              <ZoneLogo zone={m.zone} size="zl-sug" />
                              <span className={s.mName}>
                                <b>{m.zone.name}</b>
                                <small>{m.zone.emirate}</small>
                              </span>
                              <span className={`${s.tag} ${tag === "Top match" ? s.tagBest : tag === "Also fits" ? s.tagAlso : s.tagPart}`}>{tag}</span>
                            </span>
                            <span className={s.mBlurb}>{m.zone.d}</span>
                            <span className={s.mPick}>
                              <span className={s.radio}>{on ? CHECK : null}</span>
                              {on ? "Selected" : "Select this zone"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>

                  <div className={s.allZones} hidden={!showAll}>
                    <label htmlFor="estZone">Or choose any free zone</label>
                    <select id="estZone" ref={select} value={state.zone} onChange={(e) => chooseZone(e.target.value, "list")}>
                      {GROUPS.map((g) => (
                        <optgroup key={g.em} label={g.em}>
                          {g.zones.map((zn) => (
                            <option key={zn.id} value={zn.id}>
                              {zn.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className={s.pickBar}>
                    <span className={s.pickText}>
                      <small>Selected zone</small>
                      <b>{zone.name}</b>
                    </span>
                    <button type="button" className={s.cta} onClick={toAdvisor} data-cta-location="FZ Planner - Talk it through">
                      Talk it through {ARROW}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <p className={s.note}>Activity coverage is indicative. Your advisor confirms what each zone allows for your exact activity.</p>
        </div>
      </div>
    </section>
  );
}
