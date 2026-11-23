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

/*
  Section 9, id="plan": the inline form (shared with the plan pop-up, components/xservicesx/PlanForm). The tilted plan
  on the left fills live from the page state (topic, questions, advisor, reply method) and from what is typed (name,
  masked number). The green ring and the "REQUEST SENT" stamp appear only after the server confirms a new lead.
*/
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
      <span className="xs-glow" aria-hidden="true" />
      <div className="xs-wrap">
        <div className="xs-s9-head">
          <span className="xs-eyebrow xs-on-navy">ONE LAST STEP</span>
          <h2 id="xsS9">
            Your plan is almost ready. <span className="xs-copper-l">Tell us where to send it.</span>
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
            <span className="xs-paper-back d-only" aria-hidden="true" />
            <div className="xs-paper">
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
                    <span className="xs-qtags">
                      {[...s.worries].sort((a, b) => a - b).map((i) => (
                        <span key={i}>{WORRIES[i].tag}</span>
                      ))}
                    </span>
                  </>
                )}
                <>
                  <span className="xs-k">
                    <span className="d-only">YOUR ADVISOR</span>
                    <span className="m-only">ADVISOR</span>
                  </span>
                  <span className="xs-v">{advisor?.name ?? "First available advisor"}</span>
                </>
                <span className="xs-k">SEND TO</span>
                <span className={`xs-v${masked ? "" : " is-muted"}`}>
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
              <span className="xs-paper-foot">
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
    </section>
  );
}
