"use client";

import { useState } from "react";
import { PHONE_COUNTRIES } from "@/lib/phoneCountries";
import { maskPhone, nameOk } from "@/lib/servicesPlan";
import { TOPICS, TOPIC_IDS, WORRIES, type TopicId } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { setXs, useXs, xsTrack } from "./store";
import { Icon } from "./ui";
import { XsWhatsApp } from "./XsCta";
import { PlanForm, useForm } from "./PlanForm";

const RING = 182.2;

/** "Where do I begin? · Is my activity allowed? · What will year two cost? +2": the first three, then how many more. */
const questionsLine = (worries: number[]): string => {
  const tags = [...worries].sort((a, b) => a - b).map((i) => WORRIES[i].tag);
  return tags.slice(0, 3).join(" · ") + (tags.length > 3 ? ` +${tags.length - 3}` : "");
};

/** The blueprint grid behind section 9: fine lines every 48 px, major lines every 240 px. */
const Blueprint = () => (
  <svg className="xs-bp" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="xsBpFine" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M48 0H0V48" fill="none" stroke="#B9714B" strokeOpacity=".09" />
      </pattern>
      <pattern id="xsBpMajor" width="240" height="240" patternUnits="userSpaceOnUse">
        <rect width="240" height="240" fill="url(#xsBpFine)" />
        <path d="M240 0H0V240" fill="none" stroke="#B9714B" strokeOpacity=".14" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#xsBpMajor)" />
  </svg>
);

/*
  A Dubai skyline in copper line art (drawn here, not copied): Museum of the Future, Emirates Towers, Burj Khalifa,
  Cayan Tower, Burj Al Arab and the Dubai Frame, with plain towers either side. Drawn on 2400 × 150 with the landmarks in
  the middle, so a narrow screen crops only the plain sides and a wide one never crops the top.
*/
const FILLERS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let x = 0; x < 2400; x += 34 + Math.floor(rnd() * 30)) {
    const near = x > 760 && x < 1720; // lower around the landmarks so they stand out
    out.push([x, 26 + Math.floor(rnd() * 28), (near ? 18 : 26) + Math.floor(rnd() * (near ? 34 : 46))]);
  }
  return out;
})();
const LANDMARKS = [
  // Museum of the Future: a ring on a low base.
  "M786 118a34 26 0 1 0 68 0a34 26 0 1 0-68 0zM802 118a18 12 0 1 0 36 0a18 12 0 1 0-36 0z",
  "M790 140h60v10h-60z",
  // Emirates Towers: two towers with sloped tops.
  "M946 150V62l26-26V150z",
  "M988 150V80l22-20V150z",
  // Burj Khalifa: stepped setbacks and a spire.
  "M1168 150V112h6V86h6V64h6V46h5V30h4V14h3.5V0h1v14h3.5v16h4v16h5v18h6v22h6v26h6V150z",
  // Cayan Tower: a twisting tower.
  "M1318 150V56h26v94z",
  // Burj Al Arab: the sail, its mast and helipad.
  "M1470 150V30M1470 40Q1534 72 1530 150H1470z",
  "M1470 62h-16",
  // Dubai Frame.
  "M1640 150V58h60v92h-11V69h-38v81z",
];
const Skyline = () => (
  <svg className="xs-skyline" viewBox="0 0 2400 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <g fill="#B9714B" fillOpacity=".08" stroke="#B9714B" strokeOpacity=".3" strokeWidth="1.2">
      {FILLERS.map(([x, w, h]) => (
        <rect key={x} x={x + 0.5} y={150 - h} width={w - 1} height={h} />
      ))}
    </g>
    <g fill="#F6ECE2" stroke="#B9714B" strokeOpacity=".45" strokeWidth="1.4" strokeLinejoin="round" fillRule="evenodd">
      {LANDMARKS.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
    <g fill="#B9714B" fillOpacity=".12">
      {LANDMARKS.map((d) => (
        <path key={d} d={d} fillRule="evenodd" />
      ))}
    </g>
    <g stroke="#B9714B" strokeOpacity=".3" fill="none">
      {/* Cayan's twist and the Khalifa's floor lines. */}
      <path d="M1318 72l26 10M1318 92l26 10M1318 112l26 10M1318 132l26 10" />
      <path d="M1174 100h52M1180 78h40M1186 58h28M1191 40h18" />
      <path d="M0 149.5H2400" strokeOpacity=".45" />
    </g>
  </svg>
);

export function PlanSection() {
  const s = useXs();
  const { name, phone, country, status, checker } = useForm();
  const [picking, setPicking] = useState(false);

  const sent = status === "sent";
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const nameValid = nameOk(name);
  const phoneValid = !!checker && !checker.checkPlan({ name: "", phone, email: "" }, country).errors.phone;
  const pct = sent ? 1 : 0.6 + (nameValid ? 0.2 : 0) + (phoneValid ? 0.2 : 0);
  const dial = PHONE_COUNTRIES.find((c) => c.code === country)?.dial ?? "";
  const masked = maskPhone(phone, dial);
  const advisor = s.advisor && s.advisor !== "any" ? C.advisors.find((a) => a.id === s.advisor) : undefined;
  const showTopicChips = !sent && (picking || !s.topic);

  const chooseTopic = (t: TopicId) => {
    setXs({ topic: t });
    setPicking(false);
    xsTrack("xs_topic_select", { topic: t, source: "s9" });
  };


  return (
    <section className="xs-sec xs-s9" id="plan" aria-labelledby="xsS9">
      <Blueprint />
      <div className="xs-wrap">
        <span className="xs-bp-marks" aria-hidden="true">
          {["tl", "tr", "bl", "br"].map((c) => (
            <svg key={c} className={`xs-bp-x is-${c}`} width="22" height="22" viewBox="0 0 22 22">
              <path d="M11 0v22M0 11h22" />
              <circle cx="11" cy="11" r="4.5" />
            </svg>
          ))}
          <span className="xs-bp-label is-a">A-01</span>
          <span className="xs-bp-label is-b">PLAN</span>
        </span>
        <div className="xs-s9-head">
          <span className="xs-s9-eyebrow">ONE LAST STEP</span>
          <h2 id="xsS9">
            Your plan is almost ready. <span className="xs-s9-accent">Tell us where to send it.</span>
          </h2>
          <p className="xs-s9-intro">
            {s.topic || s.worries.length
              ? "We've kept what you picked. Add your details. An advisor calls you, then sends your written plan."
              : "Add your details. An advisor calls you, then sends your written plan."}
          </p>
        </div>

        <div className="xs-s9-grid">
          <div className="xs-paper-stage">
            <div className="xs-pile">
            <span className="xs-paper-back is-2" aria-hidden="true" />
            <span className="xs-paper-back is-1" aria-hidden="true" />
            <div className="xs-paper">
              <span className="xs-paper-tag">FREE ZONE · MAINLAND · TAX</span>
              <div className="xs-paper-head">
                <span>
                  <b>Best Solution · Written plan</b>
                  <span className={firstName ? "is-set" : undefined}>For: {name.trim() || "your name"}</span>
                </span>
                <span className="xs-ring d-only" aria-label={`Plan ${Math.round(pct * 100)}% ready`} role="img">
                  <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
                    <circle cx="34" cy="34" r="29" fill="none" stroke="#F3E4D8" strokeWidth="6" />
                    <circle cx="34" cy="34" r="29" fill="none" stroke={sent ? "#1F6B45" : "#B9714B"} strokeWidth="6" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - pct)} transform="rotate(-90 34 34)" />
                  </svg>
                  <span>
                    <b>{Math.round(pct * 100)}%</b>
                    <small>ready</small>
                  </span>
                </span>
                <span className={`xs-ready m-only${sent ? " is-sent" : ""}`}>{Math.round(pct * 100)}% ready</span>
              </div>

              <div className="xs-paper-rows">
                <span className="xs-k">ABOUT</span>
                <span className="xs-about">
                  {s.topic && !picking ? (
                    <>
                      <strong key={s.topic}>{TOPICS[s.topic].short}</strong>
                      {!sent && (
                        <button type="button" className="xs-change" onClick={() => setPicking(true)}>
                          Change
                        </button>
                      )}
                    </>
                  ) : sent ? (
                    <strong>{TOPICS.not_sure.short}</strong>
                  ) : (
                    showTopicChips && (
                      <span className="xs-about-chips" role="group" aria-label="What your plan is about">
                        {TOPIC_IDS.map((t) => (
                          <button key={t} type="button" aria-pressed={s.topic === t} onClick={() => chooseTopic(t)}>
                            {TOPICS[t].short}
                          </button>
                        ))}
                      </span>
                    )
                  )}
                </span>
                {s.worries.length > 0 && (
                  <>
                    <span className="xs-k">
                      <span className="d-only">YOUR QUESTIONS</span>
                      <span className="m-only">QUESTIONS</span>
                    </span>
                    <span className="xs-qline">{questionsLine(s.worries)}</span>
                  </>
                )}
                {/* Phones: the header, ABOUT and YOUR QUESTIONS only. */}
                <span className="xs-k t-up">
                  <span className="d-only">YOUR ADVISOR</span>
                  <span className="m-only">ADVISOR</span>
                </span>
                <span className="xs-v t-up">{advisor?.name ?? "First available advisor"}</span>
                <span className="xs-k t-up">SEND TO</span>
                <span className={`xs-v t-up${masked ? "" : " is-muted"}`}>
                  {s.contactPref === "whatsapp" ? "WhatsApp" : "Phone call"} · {masked ?? "your number"}
                </span>
              </div>

              <div className="xs-inside d-only">
                <span className="xs-inside-h">
                  <span>INSIDE YOUR PLAN</span>
                  <i />
                </span>
                {["Recommended structure", "Year one and after", "What to prepare", "Timeline"].map((t, i) => (
                  <span key={t} className="xs-locked">
                    <Icon name="lock" size={14} strokeWidth={2.4} />
                    <span>{t}</span>
                    <i className={i % 2 ? "alt" : undefined} />
                  </span>
                ))}
              </div>
              <span className="xs-paper-foot t-up">
                <Icon name="lock" size={12} strokeWidth={2.4} className="m-only" />
                <span className="d-only">Written by your advisor after your call.</span>
                <span className="m-only">Structure, costs, checklist and timeline: written after your call.</span>
              </span>
              {sent && <span className="xs-stamp">REQUEST SENT</span>}
            </div>
            </div>
          </div>

          <div className="xs-formcard">
            <PlanForm prefix="xs" location="s9" heading="Where should we send it?" />
            <p className="xs-formcard-foot">
              Prefer to chat?{" "}
              <XsWhatsApp location="s9" className="xs-inline-wa">
                WhatsApp us
              </XsWhatsApp>
            </p>
          </div>
        </div>
      </div>
      <Skyline />
    </section>
  );
}
