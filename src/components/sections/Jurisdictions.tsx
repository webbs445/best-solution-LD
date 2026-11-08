"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { JURIS } from "@/content/site";
import type { Jurisdiction } from "@/lib/setupPlan";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { useCalculator } from "@/components/calculator/CalculatorProvider";
import { jurisdictionLabel, trackJurisdictionInterest } from "@/lib/analytics";
import { ArrowIcon } from "@/components/ui/Icons";
import styles from "./Jurisdictions.module.css";

const KEYS: Jurisdiction[] = ["mainland", "freezone", "offshore"];

/* Mainland, free zone and offshore compared in plain language: advice only, no prices (Google Ads policy). */
export function Jurisdictions() {
  const [active, setActive] = useState<Jurisdiction>("mainland");
  const tabRefs = useRef<Partial<Record<Jurisdiction, HTMLButtonElement | null>>>({});
  const j = JURIS[active];
  const { startWithJurisdiction } = useCalculator();
  const planThis = () => {
    startWithJurisdiction(active);
    document.getElementById("calculator")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const select = (key: Jurisdiction, focus = false) => {
    setActive(key);
    if (focus) tabRefs.current[key]?.focus();
    trackJurisdictionInterest(jurisdictionLabel(key) as string, "compare", { source: "jurisdiction_tabs" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next =
      e.key === "ArrowRight" ? (i + 1) % KEYS.length
      : e.key === "ArrowLeft" ? (i + KEYS.length - 1) % KEYS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? KEYS.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    select(KEYS[next], true);
  };

  return (
    <section className="block sec-light" id="jurisdiction" aria-labelledby="jurisdiction-title">
      <div className="wrap">
        <div data-reveal="">
          <p className="section-kicker">Jurisdictions</p>
          <h2 id="jurisdiction-title">Choosing the right jurisdiction</h2>
          <p className="lede">
            Mainland, free zone and offshore are different structures, not different price points. Each determines where
            you may trade, how you bank and how you are taxed.
          </p>
        </div>

        <div data-reveal="">
          <div aria-label="UAE jurisdictions" className={styles.tabs} role="tablist">
            {KEYS.map((key, i) => (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[key] = el;
                }}
                id={`tab-${key}`}
                role="tab"
                type="button"
                className={styles.tab}
                aria-selected={active === key}
                aria-controls="jPanel"
                tabIndex={active === key ? 0 : -1}
                onClick={() => select(key)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                {JURIS[key].title}
              </button>
            ))}
          </div>

          <div aria-labelledby={`tab-${active}`} className={styles.panel} id="jPanel" role="tabpanel">
            <div aria-hidden="true" className={styles.visual}>
              {KEYS.map((key) => (
                <div key={key} className={`${styles.photo} ${key === active ? styles.photoActive : ""}`}>
                  <Image
                    src={JURIS[key].photo}
                    alt=""
                    fill
                    sizes="(max-width: 1020px) 100vw, 520px"
                    quality={85}
                    style={{ objectPosition: JURIS[key].photoPosition }}
                  />
                </div>
              ))}
              <div className={styles.visualTop}>
                <span className={styles.badge}>Best Solution</span>
              </div>
              <div className={styles.visualCopy} key={active}>
                <h3>{j.title}</h3>
                <p className={styles.suited}>{j.suited}</p>
              </div>
            </div>

            <div className={styles.side}>
              <div className={styles.swap} key={active}>
                <div className={styles.sideLabel}>At a glance</div>
                <div className={styles.best}>{j.best}</div>
                <dl className={styles.facts}>
                  <div>
                    <dt>Market access</dt>
                    <dd>{j.market}</dd>
                  </div>
                  <div>
                    <dt>Ownership</dt>
                    <dd>{j.owner}</dd>
                  </div>
                  <div>
                    <dt>Workspace</dt>
                    <dd>{j.office}</dd>
                  </div>
                  <div>
                    <dt>Corporate tax</dt>
                    <dd>{j.tax}</dd>
                  </div>
                  <div>
                    <dt>What to think about</dt>
                    <dd>{j.think}</dd>
                  </div>
                </dl>
              </div>
              <button className={`btn btn-primary btn-sm ${styles.use}`} type="button" onClick={planThis} data-cta-location={`LP Jurisdictions - Plan this structure (${j.title})`}>
                Plan a {j.title.toLowerCase()} structure <ArrowIcon />
              </button>
              <p className={styles.note}>Your advisor explains what may apply to your activity and plans.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
