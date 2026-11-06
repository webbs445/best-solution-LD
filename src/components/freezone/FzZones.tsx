"use client";

import { useEffect, useMemo, useState } from "react";
import { ACTS, ACT_LABEL, EMIRATES, POPULAR_ACTS, SECT, ZONES, type Activity, type Emirate } from "@/content/freezone";
import { ArrowIcon } from "@/components/ui/Icons";
import { ZoneLogo } from "./ZoneLogo";

/*
  "Compare free zones": plain-text comparison by activity and emirate. Advice only (Google Ads government documents
  policy): no prices, packages, licences or residency, and no authority logos. Activity coverage is indicative and
  confirmed by the advisor. Sitelink routes preset the emirate through FZ_ZONES_PRESET (FzSitelink).
*/

export const FZ_ZONES_PRESET = "fz-zones-preset";
export interface ZonesPreset {
  group?: "dubai";
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const HAY = ACTS.map((a) => [a, norm(`${a[0]} ${a[2]}`)] as const);

function searchActs(q: string): Activity[] {
  const words = norm(q).split(" ").filter(Boolean);
  if (!words.length) return [];
  return HAY.filter(([, h]) => words.every((w) => h.includes(w)))
    .map(([a]) => a)
    .slice(0, 6);
}

export function FzZones() {
  const [q, setQ] = useState("");
  const [act, setAct] = useState<Activity | null>(null);
  const [em, setEm] = useState<Emirate | "all">("all");
  const suggestions = useMemo(() => (act ? [] : searchActs(q)), [q, act]);

  useEffect(() => {
    const onPreset = (e: Event) => {
      const { group } = (e as CustomEvent<ZonesPreset>).detail ?? {};
      if (group === "dubai") setEm("Dubai");
    };
    window.addEventListener(FZ_ZONES_PRESET, onPreset);
    return () => window.removeEventListener(FZ_ZONES_PRESET, onPreset);
  }, []);

  const pick = (a: Activity) => {
    setAct(a);
    setQ(a[0]);
  };
  const clear = () => {
    setAct(null);
    setQ("");
  };

  const shown = ZONES.filter((z) => (em === "all" || z.emirate === em) && (!act || z.sect.includes(act[1])));

  return (
    <section className="fz-block fz-zx" id="zones" aria-labelledby="zonesTitle">
      <div className="wrap">
        <div className="fz-head-split">
          <p className="fz-tag">
            <span />
            Compare zones
          </p>
          <h2 id="zonesTitle">Compare {ZONES.length} UAE free zones by activity</h2>
          <p>Search your business activity to see which zones often cover it, then talk the shortlist through with an advisor.</p>
        </div>

        <div className="fz-zx-tools">
          <div className="fz-zx-search">
            <label htmlFor="zxQ">Your business activity</label>
            <input
              id="zxQ"
              type="search"
              value={q}
              placeholder="For example: e-commerce, consultancy, trading"
              autoComplete="off"
              onChange={(e) => {
                setQ(e.target.value);
                setAct(null);
              }}
            />
            {act && (
              <button type="button" className="fz-zx-clear" onClick={clear}>
                Clear activity
              </button>
            )}
            {suggestions.length > 0 && (
              <ul className="fz-zx-sug" aria-label="Matching activities">
                {suggestions.map((a) => (
                  <li key={a[0]}>
                    <button type="button" onClick={() => pick(a)}>
                      {a[0]}
                      <small>{SECT[a[1]]}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!q && (
              <div className="fz-zx-pop">
                <span>Popular:</span>
                {POPULAR_ACTS.map((name) => {
                  const a = ACTS.find((x) => x[0] === name);
                  return a ? (
                    <button key={name} type="button" onClick={() => pick(a)}>
                      {name}
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <div className="fz-zx-em" role="group" aria-label="Emirate">
            {(["all", ...EMIRATES] as const).map((e) => (
              <button key={e} type="button" aria-pressed={em === e} onClick={() => setEm(e)}>
                {e === "all" ? "All emirates" : e}
              </button>
            ))}
          </div>
        </div>

        <p className="fz-zx-count" aria-live="polite">
          {act ? `${shown.length} zones often cover ${act[0].toLowerCase()}` : `Showing ${shown.length} of ${ZONES.length} zones`}
          {em !== "all" ? ` in ${em}` : ""}
        </p>

        <ul className="fz-zx-list">
          {shown.map((z) => (
            <li key={z.id}>
              <article className="fz-zx-card">
                <ZoneLogo zone={z} size="zl-row" />
                <div>
                  <h3>{z.name}</h3>
                  <p className="fz-zx-em-name">{z.emirate}</p>
                  <p>{z.d}</p>
                  <ul className="fz-zx-tags" aria-label="Often suits">
                    {z.t.map((t) => (
                      <li key={t}>{ACT_LABEL[t]}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="fz-zx-none">No zone in this emirate is known for that activity. Your advisor can suggest alternatives.</p>}

        <div className="fz-zx-foot">
          <p>Activity coverage is indicative. Your advisor confirms what each zone allows for your exact activity.</p>
          <a className="btn btn-primary" href="#planner" data-cta-location="FZ Zones - Ask an Advisor">
            Ask an advisor about these zones <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
