"use client";

import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import { QuoteForm } from "./QuoteForm";
import { closeQuote, quoteOpener, useQuote, type QuoteState, type QuoteTopic } from "./quoteStore";
import "./an-dlg.css";

/*
  The quote pop-up (loaded on first open only, by AnQuoteHost). A native modal <dialog>: the page behind is inert and
  its scroll is locked; Tab stays inside; Escape, the close button, a click on the backdrop and (phones) the back
  gesture close it, and focus goes back to the button that opened it. Phones get a full-screen sheet sized to the
  visible viewport, so the fields stay above the iPhone keyboard. The form inside is the quote section's own form on
  the same shared state (quoteStore), so closing and reopening keeps every answer.
*/
/** The header speaks to the button that opened the pop-up: [eyebrow, light title, bold title, line under it]. */
function header(q: QuoteState): [string, string, string, string] {
  const T: Record<QuoteTopic, [string, string, string, string]> = {
    quote: ["Your quote, the same day", "Next month,", "know your numbers.", ""],
    report: ["September, on one page", "This report,", "for your business.", "Revenue, expenses, net profit and an advisor note, every month."],
    services: q.services.length
      ? ["What we do", "Your quote for", `${q.services.length === 1 ? "this service" : `these ${q.services.length} services`}.`, q.services.join(" · ")]
      : ["What we do", "Pick one,", "or let us run it all.", "Tell us what you need; we quote the services that fit."],
    check: ["Your books check", "Your result:", `${q.note || "your report"}.`, "Your quote starts with the first fixes from your report."],
    books: ["Today · 2 minutes", "Tell us about", "your books.", "Your answers from step 1 are already in."],
    start: ["First month", "We take over:", `${(q.note || "").toLowerCase()}.`, "Whatever state the books are in."],
    question: ["Your question", "Ask with", "your quote.", "An accountant answers it with your quote, the same working day."],
  };
  return T[q.topic];
}

export default function AnQuoteDialog() {
  const q = useQuote();
  const ref = useRef<HTMLDialogElement>(null);
  // True while our history entry (for the back gesture) is on the stack.
  const pushed = useRef(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (q.open && !d.open) {
      d.showModal();
      document.documentElement.classList.add("an-locked");
      history.pushState({ anQuote: true }, "");
      pushed.current = true;
    } else if (!q.open && d.open) {
      d.close();
      document.documentElement.classList.remove("an-locked");
      if (pushed.current) {
        pushed.current = false;
        history.back();
      }
      quoteOpener()?.focus({ preventScroll: true });
    }
  }, [q.open]);

  // Each open starts with focus on the current step's heading, so a screen reader hears where the form starts.
  useEffect(() => {
    if (q.open) ref.current?.querySelector<HTMLElement>(".s9-lab, .s9-done-h")?.focus();
  }, [q.open, q.opens]);

  useEffect(() => {
    // The back gesture closes the sheet, not the page.
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      closeQuote();
    };
    window.addEventListener("popstate", onPop);
    // Phones: size the sheet to the visible viewport (the iPhone keyboard shrinks it) and keep the field in view.
    const vv = window.visualViewport;
    const fit = () => {
      if (!vv || !ref.current) return;
      ref.current.style.setProperty("--an-vvh", `${vv.height}px`);
      ref.current.style.setProperty("--an-vvt", `${vv.offsetTop}px`);
    };
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);
    fit();
    return () => {
      window.removeEventListener("popstate", onPop);
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
      document.documentElement.classList.remove("an-locked");
    };
  }, []);

  // Tab and Shift+Tab move through the dialog's controls and wrap, the same in every browser (Safari would
  // otherwise skip buttons and links and leave the dialog).
  const onKey = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab") return;
    const all = [...e.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, [tabindex]")].filter(
      (el) => el.tabIndex >= 0 && el.offsetParent !== null && !el.closest("[aria-hidden='true']"),
    );
    if (!all.length) return;
    e.preventDefault();
    const i = all.indexOf(document.activeElement as HTMLElement);
    const next = e.shiftKey ? (i <= 0 ? all.length - 1 : i - 1) : i < 0 || i === all.length - 1 ? 0 : i + 1;
    all[next].focus();
  };
  // A click on the backdrop (the dialog box itself, outside the panel) closes it.
  const onClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) closeQuote();
  };
  const onFocus = (e: FocusEvent<HTMLDialogElement>) => {
    if (window.innerWidth < 900 && (e.target as Element).matches("input")) setTimeout(() => e.target.scrollIntoView({ block: "center" }), 300);
  };

  const [eye, light, bold, line] = header(q);
  return (
    <dialog
      ref={ref}
      className="an-dlg"
      aria-labelledby="an-d-title"
      onCancel={(e) => {
        e.preventDefault();
        closeQuote();
      }}
      onClick={onClick}
      onKeyDown={onKey}
      onFocus={onFocus}
    >
      <div className="an-dlg-in">
        <div className="an-dlg-top">
          <div>
            <span className="an-dlg-eye">{eye}</span>
            <h2 className="an-dlg-h" id="an-d-title">
              {light} <span>{bold}</span>
            </h2>
            {line && q.phase !== "sent" && <p className="an-dlg-svc">{line}</p>}
          </div>
          <button type="button" className="an-dlg-x" aria-label="Close" onClick={closeQuote}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <QuoteForm prefix="an-d" active={q.open} titleId="an-d-title" inPopup showQuestion={q.topic === "question"} />
      </div>
    </dialog>
  );
}
