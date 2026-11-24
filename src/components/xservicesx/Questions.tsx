"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { trackFaqExpand, trackWhatsappClick } from "@/lib/analytics";
import { CHAT_GREETING, CHAT_TITLE, FAQS, FAQ_GROUPS, askLink } from "@/content/xservicesx";
import { XS_CONFIG as C } from "@/content/xservicesx.config";
import { XsPhone } from "./XsCta";
import { getXs, reducedMotion, useMedia } from "./store";
import { Icon } from "./ui";

/*
  Section 8: the question list and a chat window that answers it. A tapped question joins the thread (the last three
  on desktop, two on phones) with typing dots for about 0.4 s before the answer. Every question and answer is also in
  the server HTML (the visually hidden list below, and the FAQPage JSON-LD in page.tsx), so search engines and screen
  readers get all of them whatever is tapped. The ask bar is a real field: send opens WhatsApp with the typed question
  (or the topic message when empty); only that text goes in the link, never a name, number or email.
*/
const ASK_MAX = 300;
const idx = (id: string) => FAQS.findIndex((f) => f.id === id);

export function Questions() {
  // Opens with three answered questions (phones show the last two); asked marks the one the visitor tapped.
  const [thread, setThread] = useState<number[]>([0, 1, 2]);
  const [asked, setAsked] = useState(false);
  const [typing, setTyping] = useState<number | null>(null);
  const isPhone = useMedia("(max-width: 1023px)");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const active = thread[thread.length - 1];

  const body = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  // The thread scrolls inside the chat: it opens at the top (TODAY and the greeting in view); a tapped question
  // scrolls down to its answer.
  useEffect(() => {
    const el = body.current;
    if (asked && el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [thread, typing, asked]);

  const ask = (i: number) => {
    if (i === active) return;
    setThread((t) => [...t.filter((x) => x !== i), i].slice(-3));
    setAsked(true);
    trackFaqExpand(FAQS[i].q);
    clearTimeout(timer.current);
    if (reducedMotion()) return setTyping(null);
    setTyping(i);
    timer.current = setTimeout(() => setTyping(null), 450);
  };
  const shown = thread.slice(isPhone ? -2 : -3);
  const [text, setText] = useState("");
  const send = (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    trackWhatsappClick("s8_ask", { has_text: !!q });
    window.open(askLink(q, getXs().topic), "_blank", "noopener");
  };

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
          {/* A WhatsApp-style chat header: back arrow, the Best Solution mark, the name with a verified tick, a call button. */}
          <div className="xs-chat-head">
            <span className="xs-chat-back" aria-hidden="true">
              <Icon name="chevronLeft" size={20} strokeWidth={2.4} />
            </span>
            <span className="xs-chat-av" aria-hidden="true">
              <Image src="/brand/icon-mark.webp" alt="" width={20} height={28} />
            </span>
            <span className="xs-chat-name">
              <span className="xs-chat-title">
                <b>{CHAT_TITLE}</b>
                {/* A verified-style badge (scalloped, drawn here). */}
                <svg className="xs-chat-ok" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <polygon points="12.00,1.40 14.25,3.60 17.30,2.82 18.15,5.85 21.18,6.70 20.40,9.75 22.60,12.00 20.40,14.25 21.18,17.30 18.15,18.15 17.30,21.18 14.25,20.40 12.00,22.60 9.75,20.40 6.70,21.18 5.85,18.15 2.82,17.30 3.60,14.25 1.40,12.00 3.60,9.75 2.82,6.70 5.85,5.85 6.70,2.82 9.75,3.60" fill="#B9714B" stroke="#B9714B" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="m7.8 12.3 2.8 2.8 5.6-5.8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <small>online</small>
            </span>
            <XsPhone location="s8_chat" href={C.phoneNumber.href} className="xs-chat-call" label={`Call ${C.phoneNumber.display}`}>
              <Icon name="phone" size={18} />
            </XsPhone>
          </div>
          {/* Scrolls when the thread is long: focusable so keyboard users can scroll it too. */}
          <div className="xs-chat-body" ref={body} role="log" aria-live="polite" aria-label="Answers" tabIndex={0}>
            <p className="xs-chat-note">
              <Icon name="help" size={14} strokeWidth={2.2} />
              <span>Answers from Best Solution advisors, in plain words. Tap a question to see it here.</span>
            </p>
            <span className="xs-chat-spacer" aria-hidden="true" />
            <span className="xs-chat-day" aria-hidden="true">
              TODAY
            </span>
            <div className="xs-bubble xs-adv-b d-only">{CHAT_GREETING}</div>
            {shown.map((i) => {
              const f = FAQS[i];
              const wait = typing === i;
              return (
                <div key={f.id} className={`xs-pair${i === active && asked ? " is-new" : ""}`}>
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
          <form className="xs-askbar" onSubmit={send}>
            <label htmlFor="xs-ask" className="sr-only">
              Your question, sent on WhatsApp
            </label>
            <input
              id="xs-ask"
              className="xs-askbar-field"
              type="text"
              enterKeyHint="send"
              autoComplete="off"
              maxLength={ASK_MAX}
              placeholder={isPhone ? "Ask your own on WhatsApp…" : "Ask your own question on WhatsApp…"}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, ASK_MAX))}
            />
            <button type="submit" className="xs-send" aria-label="Send on WhatsApp">
              <Icon name="send" size={20} strokeWidth={2.2} />
            </button>
          </form>
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
