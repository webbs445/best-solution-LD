"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EMIRATES, PK, PLANNER_ACTS, PRIORITIES, ZONES, ZONE_BY_ID, ACT_LABEL, type Priority } from "@/content/freezone";
import { SITE } from "@/content/site";
import { MAX_ACTIVITIES, MAX_SHAREHOLDERS, cleanPlanner, maxPack, maxResidents } from "@/lib/freezone";
import { formatAED } from "@/lib/pricing";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { useEstimateUnlocked } from "@/components/ui/LockedFigure";
import { QuickCapture } from "@/components/ui/QuickCapture";
import { LOCK_ICON, UNLOCK_THANKS_MS, UnlockDialog } from "@/components/ui/UnlockDialog";
import { WhatsAppIcon } from "@/components/ui/Icons";
import { FZ_FORM_ID } from "@/lib/lead";
import { trackCalculatorResultView } from "@/lib/analytics";
import { FZ_GO_PLANNER, usePlanner } from "./PlannerProvider";
import { ZoneLogo } from "./ZoneLogo";
import s from "./FzPlanner.module.css";

/*
  The free zone planner on a dark stage, in two screens.
  1. Plan: what the business does, what matters most and the team, then the best-matching zones (no prices).
     Desktop shows it all at once; phones go one step at a time with the finished steps stacked as cards.
  2. Estimate: after "Get my cost" (and the details popup the first time), the chosen zone's first-year cost,
     counted up, with the full breakdown.
*/

/* Zones for the "any of the 28" select, grouped by emirate, cheapest first. */
const GROUPS = EMIRATES.map((em) => ({
  em,
  zones: ZONES.filter((zn) => zn.emirate === em).sort((a, b) => a.price - b.price),
}));

const STEP_NAMES = ["Activities", "Priority", "Team", "Matches"];
const PHONE = "(max-width: 760px)";
const two = (n: number) => String(n).padStart(2, "0");

const PRI_INFO: Record<Priority, { desc: string; icon: ReactNode }> = {
  cost: {
    desc: "Lower first-year cost comes first",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3-1.6M12 6.5v11" />
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

function Counter({
  label,
  help,
  value,
  min,
  max,
  names,
  onStep,
}: {
  label: string;
  help: string;
  value: number;
  min: number;
  max: number;
  names: [string, string];
  onStep: (d: 1 | -1) => void;
}) {
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

/* The total eases from the figure on screen to the new one (from zero when the estimate screen opens). */
function useEasedTotal(total: number) {
  const [shown, setShown] = useState(total);
  const onScreen = useRef(total);
  useEffect(() => {
    const from = onScreen.current;
    let raf = 0;
    let start: number | null = null;
    const frame = (t: number) => {
      if (start === null) start = t;
      const p = prefersReducedMotion() ? 1 : Math.min(1, (t - start) / 1100);
      onScreen.current = from + (total - from) * (1 - Math.pow(1 - p, 3));
      setShown(onScreen.current);
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [total]);
  return shown;
}

export function FzPlanner() {
  const { state, matches, estimate, toggleAct, setPriority, step: count, chooseZone, setBank, complete } = usePlanner();
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"plan" | "estimate">("plan");
  // Phones only: which of the four planning steps is showing, and which way the last move went (for the slide).
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const select = useRef<HTMLSelectElement>(null);

  const zone = ZONE_BY_ID[state.zone];
  const mx = maxResidents(zone);
  const pack = maxPack(zone) !== null;
  const pk = PK[state.zone];
  const unlocked = useEstimateUnlocked();
  const onEstimate = view === "estimate";
  const shown = useEasedTotal(onEstimate ? estimate.total : 0);

  const toTop = () => {
    const top = stage.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) stage.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    toTop();
  };

  const showEstimate = () => {
    setDir(1);
    setView("estimate");
    trackCalculatorResultView(FZ_FORM_ID, { jurisdiction: "free_zone", estimatedCost: estimate.total });
    toTop();
  };

  const backToPlan = () => {
    setDir(-1);
    setView("plan");
    setStep(3);
    toTop();
  };

  // "Get my cost": the details popup the first time, then straight to the estimate screen.
  const getCost = () => {
    complete(undefined, undefined, "planner");
    if (unlocked) showEstimate();
    else setOpen(true);
  };

  // A zone handed over from elsewhere on the page: its estimate once prices are unlocked, else the matches step.
  const unlockedRef = useRef(unlocked);
  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);
  useEffect(() => {
    const toMatches = () => {
      setView(unlockedRef.current ? "estimate" : "plan");
      setDir(1);
      setStep(3);
    };
    window.addEventListener(FZ_GO_PLANNER, toMatches);
    return () => window.removeEventListener(FZ_GO_PLANNER, toMatches);
  }, []);

  // calculator_complete as soon as the visitor's own choice (an activity) gives a figure, not only on the button.
  const counted = useRef(false);
  const hasActs = state.acts.length > 0;
  useEffect(() => {
    if (!hasActs || counted.current) return;
    counted.current = true;
    complete(undefined, undefined, "planner_result");
  }, [hasActs, complete]);

  const pickPriority = (v: Priority) => {
    setPriority(v);
    // Phones: a tap on a priority moves straight on to the team step.
    if (window.matchMedia(PHONE).matches) window.setTimeout(() => go(2), prefersReducedMotion() ? 0 : 260);
  };

  const openAll = () => {
    setShowAll(true);
    requestAnimationFrame(() => select.current?.focus());
  };

  const resText = state.res === 0 ? "No residency" : `${state.res} ${state.res === 1 ? "person" : "people"} with residency`;
  const shText = `${state.sh} ${state.sh === 1 ? "shareholder" : "shareholders"}`;
  const actNames = state.acts.map((a) => ACT_LABEL[a]);
  const priIdx = Math.max(0, PRIORITIES.findIndex((p) => p.v === state.pri));
  const done = [
    { label: "Activities", value: actNames.join(", ") },
    { label: "Priority", value: PRIORITIES[priIdx].label },
    { label: "Team", value: `${resText} · ${shText}` },
  ].slice(0, step);
  const canNext = step === 0 ? hasActs : true;
  const pane = (n: number) => `${s.pane}${n === step ? ` ${s.on}` : ""}`;

  return (
    <section className="fz-block" id="planner" aria-labelledby="plTitle">
      <span id="finder" className="fz-anchor" />
      <span id="estimate" className="fz-anchor" />
      <div className="wrap">
        <div ref={stage} className={s.stage} data-dir={dir > 0 ? "fwd" : "back"}>
          <div className={s.glow} aria-hidden="true">
            <i />
            <i />
          </div>

          <div className={s.head}>
            <div>
              <span className={s.eyebrow}>Free zone planner</span>
              <h2 id="plTitle">{onEstimate ? "Your free zone estimate" : "Plan your free zone in one screen"}</h2>
            </div>
            <span className={s.pill}>28 free zones · Free estimate · No obligation</span>
          </div>

          {onEstimate ? (
            /* ---------- Screen 2: the estimate ---------- */
            <div className={s.est}>
              <button type="button" className={s.estBack} onClick={backToPlan}>
                {BACK_ARROW} Change zone or answers
              </button>

              <div className={s.estGrid}>
                <div className={s.estHero}>
                  <div className={s.estZone}>
                    <ZoneLogo zone={zone} size="zl-sug" alt={false} />
                    <span>
                      <b>{zone.name}</b>
                      <small>{zone.emirate}</small>
                    </span>
                  </div>
                  <span className={s.costLabel}>Your first-year cost</span>
                  <p className={s.costFig}>
                    <small>AED</small>
                    {formatAED(shown)}
                  </p>
                  <span className={s.unlocked}>{CHECK} Unlocked</span>
                  <ul className={s.estTags}>
                    {actNames.length ? <li>{actNames.join(", ")}</li> : null}
                    <li>{resText}</li>
                    <li>{shText}</li>
                    <li>
                      {state.na} {state.na === 1 ? "activity" : "activities"} on the licence
                    </li>
                  </ul>
                  <span className={s.shine} aria-hidden="true" />
                </div>

                <div className={s.estSide}>
                  <ol className={s.lines}>
                    {estimate.lines.map((l, i) => (
                      <li key={l.label} style={{ "--i": i } as CSSProperties}>
                        <span>{l.label}</span>
                        <b>{l.amount != null ? `AED ${formatAED(l.amount)}` : l.text}</b>
                      </li>
                    ))}
                    <li style={{ "--i": estimate.lines.length } as CSSProperties}>
                      <span>Year-two renewal</span>
                      <b>AED {formatAED(estimate.renewal)}</b>
                    </li>
                  </ol>
                  <label className={s.bank}>
                    <input type="checkbox" checked={state.bank} onChange={(e) => setBank(e.target.checked)} />
                    <span className={s.switch} aria-hidden="true" />
                    Add bank account help
                  </label>
                  <div className={s.estNext}>
                    <p>Your advisor sends the itemised breakdown on WhatsApp and confirms the final figure in writing.</p>
                    <a className={s.wa} href={SITE.whatsapp} target="_blank" rel="noopener" data-area="FZ Estimate">
                      <WhatsAppIcon /> Message your advisor
                    </a>
                  </div>
                </div>
              </div>

              <details className={s.incl}>
                <summary>
                  What does this estimate include?
                  <span className={s.plus} aria-hidden="true" />
                </summary>
                <div className={s.inclCols}>
                  <div>
                    <b>Included</b>
                    <ul>
                      <li>Selected free zone package</li>
                      <li>Flexi-desk or co-working lease</li>
                      <li>Residency for the people you set, using the residency costs listed in the zone&apos;s package</li>
                      <li>Extra shareholder or activity fees where the zone charges them</li>
                      <li>Bank account assistance, if selected</li>
                    </ul>
                  </div>
                  <div>
                    <b>May change</b>
                    <ul>
                      <li>Extra residency for family or staff</li>
                      <li>Change of status if you are already in the UAE</li>
                      <li>Office upgrades</li>
                      <li>External regulator sign-off for regulated activities</li>
                      <li>VIP medical, about AED 750</li>
                      <li>Authority fee updates</li>
                    </ul>
                  </div>
                </div>
              </details>
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
                    <p className={s.phoneHint}>We rank the 28 free zones around it.</p>
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
                    <div className={s.team}>
                      <Counter
                        label="Residency"
                        help={pack ? `This zone covers up to ${mx}` : "Yourself, partners and staff"}
                        value={state.res}
                        min={0}
                        max={mx}
                        names={["Fewer people", "More people"]}
                        onStep={(d) => count("res", d)}
                      />
                      <Counter
                        label="Shareholders"
                        help="Owners of the company"
                        value={state.sh}
                        min={1}
                        max={MAX_SHAREHOLDERS}
                        names={["Fewer shareholders", "More shareholders"]}
                        onStep={(d) => count("sh", d)}
                      />
                      <Counter
                        label="Activities"
                        help="Listed on your licence"
                        value={state.na}
                        min={1}
                        max={MAX_ACTIVITIES}
                        names={["Fewer activities", "More activities"]}
                        onStep={(d) => count("na", d)}
                      />
                    </div>
                    <small className={s.hint}>
                      {pk ? `${pk.actTxt}. Shareholders: ${pk.shTxt}.` : "Activity and shareholder limits for this zone are confirmed by your advisor."}
                    </small>
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

                {/* 4. Matches: pick a zone, then "Get my cost" */}
                <div className={`${s.results} ${pane(3)}`}>
                  <div className={s.resHead}>
                    <div>
                      <h3 className={s.resTitle}>Your best matches</h3>
                      <p>{actNames.length ? `Ranked for ${actNames.join(", ")}. Pick one to see its cost.` : "Pick an activity to rank the zones for you."}</p>
                    </div>
                    {showAll ? null : (
                      <button type="button" className={s.linkBtn} onClick={openAll}>
                        Compare all 28 zones
                      </button>
                    )}
                  </div>

                  <ol className={s.matches} aria-live="polite">
                    {matches.map((m, i) => {
                      const tag = !m.fits ? "Partial fit" : i === 0 ? "Best fit" : "Also fits";
                      const on = m.zone.id === state.zone;
                      return (
                        <li key={`${m.zone.id}-${state.acts.join()}-${state.pri}`} style={{ "--i": i } as CSSProperties}>
                          <button type="button" aria-pressed={on} onClick={() => chooseZone(m.zone.id, "match")}>
                            <span className={s.mTop}>
                              <ZoneLogo zone={m.zone} size="zl-sug" alt={false} />
                              <span className={s.mName}>
                                <b>{m.zone.name}</b>
                                <small>{m.zone.emirate}</small>
                              </span>
                              <span className={`${s.tag} ${tag === "Best fit" ? s.tagBest : tag === "Also fits" ? s.tagAlso : s.tagPart}`}>{tag}</span>
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
                    <button type="button" className={s.cta} onClick={getCost} data-cta-location="FZ Planner — Get my cost">
                      {unlocked ? null : <span className={s.ctaLock}>{LOCK_ICON}</span>}
                      Get my cost {ARROW}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <p className={s.note}>
            Indicative estimate in AED, based on our current rate card and subject to authority updates. Your advisor confirms the applicable
            package and final amount in writing.
          </p>
        </div>
      </div>

      <UnlockDialog
        open={open}
        onClose={() => {
          setOpen(false);
          if (unlocked) showEstimate();
        }}
        sent={unlocked}
        intro="Send your details and your free zone cost appears straight away. No obligation."
        tags={[zone.name, resText, `${state.na} ${state.na === 1 ? "activity" : "activities"}`]}
      >
        <QuickCapture
          formId={FZ_FORM_ID}
          service="free_zone"
          tone="light"
          cta="Show my cost"
          payload={() => ({ planner: cleanPlanner(state) })}
          summary={`${zone.name}, ${resText}${unlocked ? `, AED ${formatAED(estimate.total)}` : ""}`}
          onSent={() => window.setTimeout(() => setOpen(false), UNLOCK_THANKS_MS)}
          onDone={() => setOpen(false)}
        />
      </UnlockDialog>
    </section>
  );
}
