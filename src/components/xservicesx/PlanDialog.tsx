"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { TOPICS, TOPIC_IDS, WORRIES } from "@/content/xservicesx";
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
            <span className="xs-dlg-k" id="xsDlgAbout">
              About
            </span>
            <div className="xs-tchips" role="group" aria-labelledby="xsDlgAbout">
              {TOPIC_IDS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`xs-tchip${s.topic === t ? " on" : ""}`}
                  aria-pressed={s.topic === t}
                  onClick={() => {
                    setXs({ topic: t });
                    xsTrack("xs_topic_select", { topic: t, source: "popup" });
                  }}
                >
                  {TOPICS[t].short}
                </button>
              ))}
            </div>
            {s.worries.length > 0 && (
              <p className="xs-dlg-q">
                <span className="xs-dlg-k">Your questions</span> {[...s.worries].sort((a, b) => a - b).map((i) => WORRIES[i].tag).join(" · ")}
              </p>
            )}
          </div>
        )}

        <PlanForm prefix="xsd" location="popup" />

        <p className="xs-dlg-foot">
          Prefer to chat?{" "}
          <XsWhatsApp location="popup" className="xs-inline-wa">
            WhatsApp us
          </XsWhatsApp>
        </p>
      </div>
    </dialog>
  );
}
