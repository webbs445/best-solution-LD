import { SITE } from "@/content/site";
import { SPV_WA_HREF } from "@/content/spv";
import { SpvConsultForm } from "./SpvConsultForm";

/* Free consultation: what happens next, quick contact, and the form. */
export function SpvConsult() {
  return (
    <section className="sec dark-2 sheet" id="consult">
      <div className="wrap cs">
        <div className="cs-left rv">
          <span className="eyebrow">Free consultation</span>
          <h2>Get it right from day one.</h2>
          <p className="lede" style={{ marginTop: "18px" }}>
            Tell us a little about your situation. A member of our structuring team will contact you to arrange a private
            consultation.
          </p>
          <ol className="cs-steps">
            <li>
              <i>1</i>
              <div>
                <b>Share your goals</b>
                <span>What you want to protect, hold or pass on.</span>
              </div>
            </li>
            <li>
              <i>2</i>
              <div>
                <b>Talk it through</b>
                <span>A private call or meeting with an advisor.</span>
              </div>
            </li>
            <li>
              <i>3</i>
              <div>
                <b>Receive your plan</b>
                <span>A written structure map and fees, no obligation.</span>
              </div>
            </li>
          </ol>
          <div className="cs-quick">
            <a className="btn btn-wh" href={SPV_WA_HREF} target="_blank" rel="noopener" data-area="SPV Consult">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z" />
              </svg>
              WhatsApp us
            </a>
            <a className="btn btn-gh" href={SITE.phone.href} data-area="SPV Consult">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
              </svg>
              {SITE.phone.display}
            </a>
          </div>
          <p className="cs-hours">
            Business Bay, Dubai ·{" "}
            <a href={`mailto:${SITE.email}`} style={{ textDecoration: "underline" }} data-area="SPV Consult">
              {SITE.email}
            </a>
          </p>
        </div>
        {/* Reveal wrapper: SpvMotion adds .in here, outside the form's own re-renders. */}
        <div className="rv d1 fm-wrap">
          <SpvConsultForm />
        </div>
      </div>
    </section>
  );
}
