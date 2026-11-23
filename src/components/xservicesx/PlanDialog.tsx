"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TOPICS, TOPIC_IDS, WORRIES, type TopicId } from "@/content/xservicesx";
import { popupOpener, setXs, useXs, xsTrack } from "./store";
import { Icon } from "./ui";
import { XsWhatsApp } from "./XsCta";
import { PlanForm, useForm } from "./PlanForm";

/*
  The plan pop-up (id xs-plan-dialog): every plan, call-back and sticky-bar button opens it (store goToPlan) instead of
  scrolling to section 9. A bottom sheet on phones, a centred panel from 768 px. It shares the form with section 9
  (components/xservicesx/PlanForm), shows what was picked on the page and lets the visitor change the topic.
  Escape or a tap outside closes it; focus goes back to the button that opened it.
*/
export function PlanDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const s = useXs();
  const { status } = useForm();
  const sent = status === "sent";

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const onClose = () => popupOpener()?.focus();
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, []);

  return (
    <dialog
      ref={ref}
      id="xs-plan-dialog"
      className="xs-dialog"
      aria-labelledby="xsDlgTitle"
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="xs-dlg-in">
        <div className="xs-dlg-head">
          <span className="xs-dlg-mark" aria-hidden="true">
            <Image src="/brand/icon-mark.webp" alt="" width={18} height={26} />
          </span>
          <div className="xs-dlg-titles">
            <span className="xs-eyebrow xs-on-navy">YOUR WRITTEN PLAN</span>
            <h2 id="xsDlgTitle">{sent ? "Request sent." : "Tell us where to send it."}</h2>
          </div>
          <button type="button" className="xs-dlg-close" aria-label="Close" onClick={() => ref.current?.close()}>
            <Icon name="plus" size={20} strokeWidth={2.4} />
          </button>
        </div>

        {!sent && (
          <div className="xs-dlg-picks">
            <label className="xs-dlg-k" htmlFor="xsd-topic">
              Your plan is about
            </label>
            <span className="xs-dlg-sel">
              <select
                id="xsd-topic"
                value={s.topic ?? ""}
                onChange={(e) => {
                  const t = e.target.value as TopicId;
                  setXs({ topic: t });
                  xsTrack("xs_topic_select", { topic: t, source: "popup" });
                }}
              >
                {!s.topic && (
                  <option value="" disabled>
                    Pick a topic
                  </option>
                )}
                {TOPIC_IDS.map((t) => (
                  <option key={t} value={t}>
                    {TOPICS[t].short}
                  </option>
                ))}
              </select>
            </span>
            {s.worries.length > 0 && (
              <p className="xs-dlg-q">
                <Icon name="check" size={14} strokeWidth={2.6} />
                <span>
                  {s.worries.length === 1 ? "1 question" : `${s.worries.length} questions`} added:{" "}
                  {[...s.worries].sort((a, b) => a - b).map((i) => WORRIES[i].tag).join(" · ")}
                </span>
              </p>
            )}
          </div>
        )}

        <PlanForm prefix="xsd" location="popup" compact />

        {!sent && (
          <p className="xs-dlg-foot">
            Prefer to chat?{" "}
            <XsWhatsApp location="popup" className="xs-inline-wa">
              WhatsApp us
            </XsWhatsApp>
          </p>
        )}
      </div>
    </dialog>
  );
}
