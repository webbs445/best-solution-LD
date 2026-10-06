"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EMIRATES, PK, PLANNER_ACTS, PRIORITIES, ZONES, ZONE_BY_ID, ACT_LABEL } from "@/content/freezone";
import { MAX_ACTIVITIES, MAX_SHAREHOLDERS, maxPack, maxResidents, type Match } from "@/lib/freezone";
import { formatAED } from "@/lib/pricing";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { ArrowIcon } from "@/components/ui/Icons";
import { FzLeadForm } from "./FzLeadForm";
import { usePlanner } from "./PlannerProvider";

const COLORS = ["#cc8667", "#e8b79f", "#8aa0c2", "#dfe5ef", "#5d7aa3", "#f3d2c1"];
const RING = 2 * Math.PI * 48;

/* Zones for the "any of the 28" select, grouped by emirate, cheapest first. */
const GROUPS = EMIRATES.map((em) => ({
  em,
  zones: ZONES.filter((zn) => zn.emirate === em).sort((a, b) => a.price - b.price),
}));

function Stepper({
  label,
  value,
  min,
  max,
  onStep,
  small,
  names,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onStep: (d: 1 | -1) => void;
  small?: boolean;
  names: [string, string];
}) {
  return (
    <div className={`fz-stepper${small ? " fz-stepper-s" : ""}`} role="group" aria-label={label}>
      <button type="button" aria-label={names[0]} disabled={value <= min} onClick={() => onStep(-1)}>
        &minus;
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={names[1]} disabled={value >= max} onClick={() => onStep(1)}>
        +
      </button>
    </div>
  );
}

/* A match card's bar fills shortly after it appears, staggered by rank. */
function MatchBar({ pct, rank }: { pct: number; rank: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW(pct), 60 + rank * 60);
    return () => window.clearTimeout(t);
  }, [pct, rank]);
  return (
    <div className="pm-bar">
      <i style={{ width: `${w}%` }} />
    </div>
  );
}

function Matches({ matches, selected, onPick }: { matches: Match[]; selected: string; onPick: (id: string) => void }) {
  return (
    <ol className="pl-matches" aria-live="polite">
      {matches.map((m, i) => (
        <li key={`${m.zone.id}-${m.pct}-${m.total}`}>
          <button type="button" aria-pressed={m.zone.id === selected} onClick={() => onPick(m.zone.id)}>
            <div className="pm-top">
              <b>{m.zone.name}</b>
              <span className="pm-pct">{m.pct}% match</span>
            </div>
            <MatchBar pct={m.pct} rank={i} />
            <div className="pm-foot">
              <span>{m.zone.d}</span>
              <strong>AED {formatAED(m.total)}</strong>
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}

/* Passport-style figures for the people needing residency (up to six, then "+n"). */
function People({ n }: { n: number }) {
  return (
    <div className="pl-people" aria-hidden="true">
      {Array.from({ length: Math.min(n, 6) }, (_, i) => (
        <i key={i}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle className="ring" cx="12" cy="12" r="10.7" />
            <circle className="fig" cx="12" cy="8.9" r="4.1" />
            <path className="fig" d="M4.6 18.2C5.9 15.3 8.7 13.9 12 13.9s6.1 1.4 7.4 4.3A9.6 9.6 0 0 1 4.6 18.2z" />
          </svg>
        </i>
      ))}
      {n > 6 && <small>+{n - 6}</small>}
    </div>
  );
}

function Donut({ values }: { values: number[] }) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  // Each segment starts where the previous ones end.
  const segs = COLORS.map((color, i) => {
    const v = values[i] || 0;
    const start = values.slice(0, i).reduce((a, b) => a + b, 0);
    const style: CSSProperties = {
      stroke: color,
      strokeDasharray: `${Math.max(0, (v / total) * RING - (v ? 2 : 0))} ${RING}`,
      strokeDashoffset: -(start / total) * RING,
    };
    return style;
  });
  return (
    <svg className="pl-donut" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="48" className="pl-ring" />
      <g>
        {segs.map((style, i) => (
          <circle key={i} cx="60" cy="60" r="48" className="seg" style={style} />
        ))}
      </g>
    </svg>
  );
}

/* The total eases from the figure on screen to the new one. */
function useEasedTotal(total: number) {
  const [shown, setShown] = useState(total);
  const onScreen = useRef(total);
  useEffect(() => {
    const from = onScreen.current;
    let raf = 0;
    let start: number | null = null;
    const frame = (t: number) => {
      if (start === null) start = t;
      const p = prefersReducedMotion() ? 1 : Math.min(1, (t - start) / 500);
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
  const { state, matches, estimate, toggleAct, setPriority, step, chooseZone, setBank, complete } = usePlanner();
  const [showAll, setShowAll] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const select = useRef<HTMLSelectElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const zone = ZONE_BY_ID[state.zone];
  const mx = maxResidents(zone);
  const pack = maxPack(zone) !== null;
  const pk = PK[state.zone];
  const shown = useEasedTotal(estimate.total);

  // Colour each priced line; text-only lines get a faint marker.
  const values: number[] = [];
  const lines = estimate.lines.map((l) => {
    let c = "rgba(255,255,255,.2)";
    if (l.amount) {
      c = COLORS[values.length % 6];
      values.push(l.amount);
    }
    return { ...l, c };
  });

  const openAll = () => {
    setShowAll(true);
    requestAnimationFrame(() => select.current?.focus());
  };

  const openDrawer = () => {
    setDrawer(true);
    complete();
    requestAnimationFrame(() => {
      drawerRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      window.setTimeout(() => nameInput.current?.focus({ preventScroll: true }), 400);
    });
  };

  return (
    <section className="fz-block pl" id="planner" aria-labelledby="plTitle">
      <span id="finder" className="fz-anchor" />
      <span id="estimate" className="fz-anchor" />
      <div className="wrap">
        <div className="fz-head-split">
          <h2 id="plTitle">Plan your free zone in one screen</h2>
          <p>
            Choose what your business will do. Matching zones rank as you choose, and your estimated first-year cost updates
            as you go.
          </p>
        </div>

        <div className="pl-grid">
          {/* A. Business */}
          <div className="pl-panel pl-a spot">
            <div className="pl-step">
              <span>1</span>Your business
            </div>
            <p className="pl-q">
              What will you do? <small>Pick up to 3</small>
            </p>
            <div className={`pl-acts${state.acts.length >= 3 ? " max" : ""}`} role="group" aria-label="Business activities">
              {PLANNER_ACTS.map((a) => (
                <button key={a.v} type="button" aria-pressed={state.acts.includes(a.v)} onClick={() => toggleAct(a.v)}>
                  <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: a.icon }} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
            <p className="pl-q">What matters most?</p>
            <div className="pl-seg" role="group" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button key={p.v} type="button" aria-pressed={state.pri === p.v} onClick={() => setPriority(p.v)}>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="pl-q">People needing UAE residency</p>
            <div className="pl-team">
              <Stepper
                label="People needing residency"
                names={["Fewer people", "More people"]}
                value={state.res}
                min={0}
                max={mx}
                onStep={(d) => step("res", d)}
              />
              <People n={state.res} />
            </div>
            <small className="pl-hint">
              {pack
                ? `This zone's packages cover up to ${mx}${mx === 1 ? " person" : " people"}. Your advisor quotes larger teams.`
                : "Include yourself, partners and employees."}
            </small>
            <div className="pl-two">
              <div>
                <p className="pl-q">Shareholders</p>
                <Stepper
                  small
                  label="Shareholders"
                  names={["Fewer shareholders", "More shareholders"]}
                  value={state.sh}
                  min={1}
                  max={MAX_SHAREHOLDERS}
                  onStep={(d) => step("sh", d)}
                />
              </div>
              <div>
                <p className="pl-q">Activities</p>
                <Stepper
                  small
                  label="Activities in the package"
                  names={["Fewer activities", "More activities"]}
                  value={state.na}
                  min={1}
                  max={MAX_ACTIVITIES}
                  onStep={(d) => step("na", d)}
                />
              </div>
            </div>
            <small className="pl-hint">
              {pk
                ? `${pk.actTxt}. Shareholders: ${pk.shTxt}.`
                : "Activity and shareholder limits for this zone are confirmed by your advisor."}
            </small>
          </div>

          {/* B. Matches */}
          <div className="pl-panel pl-b spot">
            <div className="pl-step">
              <span>2</span>Matching zones
            </div>
            <p className="pl-q">
              {state.acts.length ? `Ranked for ${state.acts.map((a) => ACT_LABEL[a]).join(", ")}` : "Pick an activity to rank zones"}
            </p>
            <Matches matches={matches} selected={state.zone} onPick={(id) => chooseZone(id, "match")} />
            {!showAll && (
              <button type="button" className="pl-all" onClick={openAll}>
                Choose any of the 28 zones
              </button>
            )}
            <div className="fz-select pl-select" hidden={!showAll}>
              <label className="fz-sr" htmlFor="estZone">
                Free zone
              </label>
              <select id="estZone" ref={select} value={state.zone} onChange={(e) => chooseZone(e.target.value, "list")}>
                {GROUPS.map((g) => (
                  <optgroup key={g.em} label={g.em}>
                    {g.zones.map((zn) => (
                      <option key={zn.id} value={zn.id}>
                        {zn.name} (from AED {formatAED(zn.price)})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* C. Cost */}
          <div className="pl-panel pl-c fz-receipt">
            <div className="pl-step pl-step-light">
              <span>3</span>Estimated first-year cost
            </div>
            <div className="pl-cost-top">
              <Donut values={values} />
              <div className="pl-total">
                <small>AED</small>
                <b>{formatAED(shown)}</b>
                <span>{zone.name}</span>
              </div>
            </div>
            <ol className="fzr-lines">
              {lines.map((l, i) => (
                <li key={i} style={{ "--c": l.c } as CSSProperties}>
                  <span>{l.label}</span>
                  <b>{l.amount != null ? `AED ${formatAED(l.amount)}` : l.text}</b>
                </li>
              ))}
            </ol>
            <div className="pl-opts">
              <label className="fz-toggle pl-bank">
                <input type="checkbox" checked={state.bank} onChange={(e) => setBank(e.target.checked)} />
                <span />
                Bank account assistance
              </label>
            </div>
            <div className="fzr-renew">
              <span>Estimated year-two renewal</span>
              <b>AED {formatAED(estimate.renewal)}</b>
            </div>
            <details className="pl-incl-box">
              <summary>What does this estimate include?</summary>
              <div className="pl-incl-cols">
                <div>
                  <b>Included</b>
                  <ul>
                    <li>Selected free zone package</li>
                    <li>Flexi-desk or co-working lease</li>
                    <li>
                      Residency for the people you set, using the residency costs listed in the zone&apos;s package
                    </li>
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
                    <li>External approvals for regulated activities</li>
                    <li>VIP medical, about AED 750</li>
                    <li>Authority fee updates</li>
                  </ul>
                </div>
              </div>
            </details>
            <button type="button" className="btn btn-primary btn-block" onClick={openDrawer} data-cta-location="FZ Planner — Get My Estimate in Writing">
              Get My Estimate in Writing <ArrowIcon />
            </button>
            <p className="fzr-note">
              Indicative estimate in AED, based on our current rate card and subject to authority updates. Your advisor
              confirms the applicable package and final amount in writing.
            </p>
          </div>
        </div>

        {/* Lead form drawer */}
        <div className="pl-drawer" id="plDrawer" hidden={!drawer} ref={drawerRef}>
          <div className="pl-drawer-in">
            <div className="pl-drawer-copy">
              <h3>Request this estimate in writing</h3>
              <p>
                {zone.name}, {state.res}
                {state.res === 1 ? " person" : " people"} with residency, {state.sh} shareholder{state.sh > 1 ? "s" : ""},{" "}
                {state.na} activit{state.na > 1 ? "ies" : "y"}, estimated first-year cost AED {formatAED(estimate.total)}.
              </p>
            </div>
            <FzLeadForm
              ref={nameInput}
              planner={state}
              summary={`${zone.name} · ${state.res} ${state.res === 1 ? "person" : "people"} with residency · AED ${formatAED(estimate.total)}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
