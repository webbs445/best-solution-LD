"use client";

import { useState } from "react";
import { AnCta, AnWhatsApp } from "./AnLinks";
import { EMPTY, QUESTIONS, answerLine, answeredCount, getResult, reset, setTrading, type CheckState } from "./checkLogic";
import { useInView } from "./motion";
import { prefillFromCheck } from "./quoteLogic";
import { accTrack } from "./track";
import "./an-s3.css";

const Tick = ({ size = 16, w = 2.4 }: { size?: number; w?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5 9-10" />
  </svg>
);

/* Section 3: the books check. Nothing leaves the browser except the fixed-value acc_check_* events. */
export function AnCheck() {
  const [s, setS] = useState<CheckState>(EMPTY);
  const [ref, seen] = useInView<HTMLElement>(0.2);
  const r = getResult(s);
  const answered = answeredCount(s);

  // Report the move, and the result when a new one is reached (fixed labels only).
  const go = (next: CheckState, line: number, yes: boolean) => {
    accTrack("acc_check_answer", { line, answer: yes ? "Yes" : "No" });
    const nr = getResult(next);
    if (nr && nr.title !== r?.title) accTrack("acc_check_result", { result: nr.title });
    setS(next);
  };

  return (
    <section id="check" className="s3" ref={ref} aria-labelledby="s3-h">
      <div className="an-wrap s3-grid">
        <div className="s3-intro">
          <span className="s3-eyebrow">Your turn</span>
          <h2 id="s3-h" className="an-h s3-h">
            Your books,
            <br />
            <b>on one page.</b>
          </h2>
          <p className="s3-lead">Tick each line the way it is today. Your report fills in as you go, and you see your result at the bottom. It takes about a minute.</p>
          <div className="s3-points">
            <span>
              <Tick />
              No name, number or email needed
            </span>
            <span>
              <Tick />
              Your result shows your first fixes
            </span>
          </div>
          {r && (
            <div className="s3-next">
              <span className="s3-rtext">{r.text}</span>
              <span className="s3-btns">
                {/* Opens the quote pop-up with only what the ticks prove (prefillFromCheck). */}
                <AnCta section={3} className="an-btn1 s3-btn1" prefill={prefillFromCheck(s.trading, s.a[0])} topic="check" note={r.title}>
                  {r.cta}{" "}
                  <span className="s3-arr">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </AnCta>
                <AnWhatsApp section={3} className="an-btn2 s3-btn2">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1F8F4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6L3 21z" />
                  </svg>
                  WhatsApp
                </AnWhatsApp>
              </span>
              <button type="button" className="s3-lnk" onClick={() => setS(reset())}>
                Clear and tick again
              </button>
            </div>
          )}
        </div>

        <div className="s3-sheet an-num">
          <div className="s3-head">
            <span className="s3-title">
              <span className="s3-cap">BOOKS HEALTH REPORT</span>
              <span className="s3-co">Your company</span>
            </span>
            <span className="s3-prog">{s.trading === false ? "Done" : `${answered} of 5 ticked`}</span>
          </div>

          <div className="s3-line s3-line0">
            <span className="s3-n">00</span>
            <span className="s3-q" id="s3-q0">
              Is your company trading yet?
            </span>
            <span className="s3-seg" role="group" aria-labelledby="s3-q0">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  className={s.trading === v ? "s3-sg on" : "s3-sg"}
                  aria-pressed={s.trading === v}
                  aria-label={`Is your company trading yet? ${v ? "Trading" : "Not yet"}`}
                  onClick={() => go(setTrading(s, v), 0, v)}
                >
                  {v ? "Trading" : "Not yet"}
                </button>
              ))}
            </span>
          </div>

          {s.trading !== false && (
            <div>
              {QUESTIONS.map((q, k) => {
                const v = s.a[k];
                return (
                  <div key={q} className={v === false ? "s3-line no" : "s3-line"}>
                    <span className="s3-n">0{k + 1}</span>
                    <span className="s3-q" id={`s3-q${k + 1}`}>
                      {q}
                    </span>
                    <span className="s3-boxes" role="group" aria-labelledby={`s3-q${k + 1}`}>
                      <button type="button" className={v === true ? "s3-bx y" : "s3-bx"} aria-pressed={v === true} aria-label={`${q}: Yes`} onClick={() => go(answerLine(s, k, true), k + 1, true)}>
                        <span className="s3-sq">
                          <Tick size={13} w={3.6} />
                        </span>
                        Yes
                      </button>
                      <button type="button" className={v === false ? "s3-bx n" : "s3-bx"} aria-pressed={v === false} aria-label={`${q}: No`} onClick={() => go(answerLine(s, k, false), k + 1, false)}>
                        <span className="s3-sq">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </span>
                        No
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {s.trading === false && <div className="s3-day">You&apos;re not behind, you&apos;re early. We decide with you how your books are kept from day one, so your first tax return is easy.</div>}

          <div className="s3-result" aria-live="polite">
            <span className="s3-cap">RESULT</span>
            {!r && (
              <div className="s3-wait">{s.trading === null ? "Tick each line. Your result appears here." : `${5 - answered} lines left to tick`}</div>
            )}
            {r && r.fixes.length > 0 && (
              <div className="s3-fixes">
                {r.fixes.map((f) => (
                  <div className="s3-fix" key={f}>
                    <span className="s3-ft">
                      <Tick size={10} w={3.6} />
                    </span>
                    {f}
                  </div>
                ))}
              </div>
            )}
            {r && (
              <span className={seen ? "s3-stamp s3-anim" : "s3-stamp"} style={{ color: r.color }}>
                {r.title}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
