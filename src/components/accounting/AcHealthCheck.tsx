"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HEALTH_AREAS, HEALTH_QUESTIONS, SERVICE_NAMES, type ServiceKey } from "@/content/accounting";
import { trackEvent } from "@/lib/analytics";

/** Fired on window when the check completes; the quote form adds the result to the lead. */
export const AC_HEALTH_EVENT = "ac-health-result";
export interface HealthResult {
  score: number;
  summary: string;
  service: ServiceKey;
}

const RING = 326.7;

function verdict(gaps: ServiceKey[]) {
  const n = gaps.length;
  if (!n)
    return { title: "Your books look healthy", text: "Good routine. An accountant can check your records are in order for VAT and year-end.", rec: "not_sure" as ServiceKey, badge: "Healthy" };
  if (n === 1)
    return { title: "One gap to close", text: "Mostly on track. Fixing this one area now stops it growing into a year-end problem.", rec: gaps[0], badge: "Nearly there" };
  if (n <= 3)
    return { title: "Worth fixing this month", text: "Several gaps usually share one cause: books that aren’t closed monthly. A regular routine fixes them together.", rec: "complete" as ServiceKey, badge: "Needs attention" };
  return { title: "Time for a catch-up", text: "Your books likely need a catch-up first. We rebuild the missing periods, then keep them current every month.", rec: "complete" as ServiceKey, badge: "Needs attention" };
}

/* "How healthy are your books?": four yes/no questions, then a score out of 100 and a suggested first step. */
export function AcHealthCheck() {
  const [ans, setAns] = useState<boolean[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [shownScore, setShownScore] = useState(0);
  const [ringOffset, setRingOffset] = useState(RING);
  const panel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const qi = ans.length;
  const done = qi >= HEALTH_QUESTIONS.length;
  const gaps = ans.map((a, i) => (a ? null : HEALTH_QUESTIONS[i][4])).filter((g): g is ServiceKey => g !== null);
  const score = (HEALTH_QUESTIONS.length - gaps.length) * 25;
  const v = verdict(gaps);

  const answer = useCallback(
    (yes: boolean) => {
      if (busy.current || ans.length >= HEALTH_QUESTIONS.length) return;
      if (ans.length === 0) trackEvent("health_check_start");
      busy.current = true;
      setLeaving(true);
      window.setTimeout(() => {
        busy.current = false;
        setLeaving(false);
        setAns((a) => [...a, yes]);
      }, 260);
    },
    [ans.length],
  );

  // On completion: animate the ring and score, report it, and hand the result to the quote form.
  useEffect(() => {
    if (!done) return;
    const n = gaps.length;
    trackEvent("health_check_complete", { gaps: n, recommendation: v.rec });
    const areas = HEALTH_AREAS.filter((_, i) => !ans[i]).map((a) => a.title.toLowerCase());
    const detail: HealthResult = {
      score,
      summary: `${score}/100${areas.length ? `, gaps: ${areas.join(", ")}` : ", no gaps"}`,
      service: v.rec,
    };
    window.dispatchEvent(new CustomEvent(AC_HEALTH_EVENT, { detail }));
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setRingOffset(RING * (1 - score / 100))));
    const t0 = performance.now();
    let id = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1200);
      setShownScore(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(id);
    };
    // Runs once per completed check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Keyboard: Y / N while the panel is on screen (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = panel.current;
      if (!p) return;
      const r = p.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.8 || r.bottom < window.innerHeight * 0.2) return;
      if (/input|select|textarea/i.test((e.target as HTMLElement).tagName)) return;
      const k = e.key.toLowerCase();
      if (k === "y") answer(true);
      else if (k === "n") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  const reset = () => {
    setAns([]);
    setShownScore(0);
    setRingOffset(RING);
  };

  const q = HEALTH_QUESTIONS[Math.min(qi, HEALTH_QUESTIONS.length - 1)];

  return (
    <section className="sheet s-navy dark-zone" id="check">
      <div className="grid-lines" aria-hidden="true" />
      <div className="wrap hc">
        <div className="hc-intro rv">
          <span className="kicker">Four-question health check</span>
          <h2 style={{ marginTop: 16 }}>How healthy are your books?</h2>
          <p className="lede">Four yes or no questions about how your books are kept today. No sign-up needed.</p>
          <ol className="hc-areas" id="hcAreas">
            {HEALTH_AREAS.map((a, i) => {
              const state = i < qi ? (ans[i] ? "y" : "n") : i === qi && !done ? "cur" : "";
              return (
                <li key={a.title} className={state || undefined}>
                  <span className="num">0{i + 1}</span>
                  <div>
                    <b>{a.title}</b>
                    <small>{a.note}</small>
                  </div>
                  <em>{i < qi ? (ans[i] ? "In place" : "Gap") : i === qi ? "Checking" : "Pending"}</em>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={`hc-panel rv d1${done ? " done" : ""}`} aria-live="polite" ref={panel}>
          <div className="hc-top">
            <div className="hc-title">
              <span className="dot" />
              Books health check
            </div>
            <span className="hc-count">{done ? "Complete" : `Question ${qi + 1} of 4`}</span>
          </div>
          <div className="hc-prog">
            {HEALTH_QUESTIONS.map((_, i) => (
              <i key={i} className={done || i < qi ? "on" : i === qi ? "cur" : undefined} />
            ))}
          </div>

          <div className="hc-body">
            <div className="hc-stage">
              {!done && (
                <div className={`hc-q${leaving ? " out" : ""}`} key={qi}>
                  <span className="qi">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: q[3] }}
                    />
                  </span>
                  <h3>{q[0]}</h3>
                  <p>{q[1]}</p>
                  <div className="why">
                    Why it matters: <b>{q[2]}</b>
                  </div>
                </div>
              )}
            </div>
            <div className="hc-acts">
              <button type="button" className="hc-no" onClick={() => answer(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                No
              </button>
              <button type="button" className="hc-yes" onClick={() => answer(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-10" />
                </svg>
                Yes
              </button>
            </div>
            <p className="hc-keys">
              Keyboard: <kbd>Y</kbd> yes, <kbd>N</kbd> no
            </p>
          </div>

          <div className="hc-res">
            <div className="hc-score">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle className="trk" cx="60" cy="60" r="52" />
                <circle className={`val${gaps.length <= 1 ? " ok" : ""}`} cx="60" cy="60" r="52" style={{ strokeDashoffset: ringOffset }} />
              </svg>
              <div>
                <b>{shownScore}</b>
                <small>out of 100</small>
              </div>
            </div>
            <div className="hc-rtext">
              <span className={`hc-badge${gaps.length <= 1 ? " ok" : ""}`}>{done ? v.badge : "Result"}</span>
              {done && (
                <>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </>
              )}
            </div>
            <div className="hc-rec">
              <div>
                <small>Suggested first step</small>
                <b>{done ? SERVICE_NAMES[v.rec] : ""}</b>
              </div>
              <a className="btn btn-copper" href="#contact" data-service={v.rec} data-cta-location="AC Health Check — Get this quoted">
                Get this quoted
              </a>
            </div>
            <button type="button" className="hc-again" onClick={reset}>
              Retake the check
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
