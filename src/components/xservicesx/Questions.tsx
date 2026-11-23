"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_GREETING, CHAT_REPLIES, CHAT_TITLE, FAQS, FAQ_GROUPS } from "@/content/xservicesx";
import { reducedMotion, useMedia, xsTrack } from "./store";
import { Icon } from "./ui";
import { XsWhatsApp } from "./XsCta";

/*
  Section 8: the question list and a chat window that answers it. A tapped question joins the thread (the last three
  on desktop, two on phones) with typing dots for about 0.4 s before the answer. Every question and answer is also in
  the server HTML (the visually hidden list below, and the FAQPage JSON-LD in page.tsx), so search engines and screen
  readers get all of them whatever is tapped.
*/
const idx = (id: string) => FAQS.findIndex((f) => f.id === id);

export function Questions() {
  const [thread, setThread] = useState<number[]>([0, 1]);
  const [typing, setTyping] = useState<number | null>(null);
  const isPhone = useMedia("(max-width: 1023px)");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const active = thread[thread.length - 1];

  useEffect(() => () => clearTimeout(timer.current), []);

  const ask = (i: number) => {
    if (i === active) return;
    setThread((t) => [...t.filter((x) => x !== i), i].slice(-3));
    xsTrack("xs_faq_open", { question_id: FAQS[i].id });
    clearTimeout(timer.current);
    if (reducedMotion()) return setTyping(null);
    setTyping(i);
    timer.current = setTimeout(() => setTyping(null), 450);
  };
  const shown = thread.slice(isPhone ? -2 : -3);

  return (
    <section className="xs-sec xs-s8" id="faq" aria-labelledby="xsS8">
      <div className="xs-wrap xs-s8-grid">
        <div className="xs-s8-left">
          <div className="xs-head">
            <span className="xs-eyebrow">QUESTIONS FOUNDERS ASK</span>
            <h2 id="xsS8">
              Ask us anything.<span className="d-only"> Here&apos;s what most people ask first.</span>
            </h2>
            <p className="xs-lede">
              <span className="d-only">Tap a question. You get the same straight answer our advisors give every day.</span>
              <span className="m-only">Tap a question to see the answer.</span>
            </p>
          </div>
          <div className="xs-qgroups d-only">
            {FAQ_GROUPS.map((g) => (
              <div key={g.label} className="xs-qgroup">
                <span className="xs-eyebrow xs-grey">{g.label}</span>
                {g.qs.map((q) => {
                  const i = idx(q.id);
                  return (
                    <button key={q.id} type="button" className="xs-qbtn" aria-pressed={i === active} onClick={() => ask(i)}>
                      <span>
                        <b>{q.q}</b>
                        <span>{q.preview}</span>
                      </span>
                      <span className="xs-qicon" aria-hidden="true">
                        <Icon name="chevronRight" size={14} strokeWidth={2.4} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="xs-chiprail m-only" role="group" aria-label="Questions">
            {FAQS.map((q, i) => (
              <button key={q.id} type="button" className="xs-qchip" aria-pressed={i === active} onClick={() => ask(i)}>
                {q.qShort}
              </button>
            ))}
          </div>
        </div>

        <div className="xs-chat">
          <div className="xs-chat-head">
            <span className="xs-chat-av" aria-hidden="true">
              <Icon name="user" size={20} />
              <i />
            </span>
            <span>
              <b>{CHAT_TITLE}</b>
              {CHAT_REPLIES && <small>{CHAT_REPLIES}</small>}
            </span>
          </div>
          <div className="xs-chat-body" aria-live="polite">
            <div className="xs-bubble xs-adv-b d-only">{CHAT_GREETING}</div>
            {shown.map((i) => {
              const f = FAQS[i];
              const wait = typing === i;
              return (
                <div key={f.id} className={`xs-pair${i === active && thread.length > 2 ? " is-new" : ""}`}>
                  <div className="xs-bubble xs-me">{isPhone ? f.qShort : f.q}</div>
                  {wait ? (
                    <div className="xs-bubble xs-adv-b xs-typing" aria-label="Typing">
                      <i />
                      <i />
                      <i />
                    </div>
                  ) : (
                    <div className="xs-bubble xs-adv-b">{isPhone ? f.aShort : f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
          <XsWhatsApp location="s8" className="xs-askbar">
            <span className="xs-askbar-field">
              <span className="d-only">Ask your own question on WhatsApp…</span>
              <span className="m-only">Ask your own on WhatsApp…</span>
            </span>
            <span className="xs-send" aria-hidden="true">
              <Icon name="send" size={20} strokeWidth={2.2} />
            </span>
          </XsWhatsApp>
        </div>

        <dl className="sr-only">
          {FAQS.map((f) => (
            <div key={f.id}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
