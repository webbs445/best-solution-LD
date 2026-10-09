/* Find your fit: three questions (the card is rendered by SpvMotion). Converted from the structuring landing page HTML. */
export function SpvFit() {
  return (
    <>
<section className="sec dark-2 sheet" id="fit">
  <div className="fx-glow" aria-hidden="true"></div>
  <div className="wrap ff">
    <div className="ff-side rv">
      <span className="eyebrow">Find your fit</span>
      <h2 style={{ marginTop: "18px" }}>Three questions. A clear place to begin.</h2>
      <p className="lede" style={{ marginTop: "18px" }}>Answer three short questions and see which structure our team would usually discuss first.</p>
      <ol className="fx-steps" id="fxSteps"><li data-i="0"><button type="button" className="fx-dot" tabIndex={-1}><b>1</b><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></i></button><div><small>Step 1</small><span>What you want the structure to do</span><em>Waiting for your answer</em></div></li><li data-i="1"><button type="button" className="fx-dot" tabIndex={-1}><b>2</b><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></i></button><div><small>Step 2</small><span>Where your assets are today</span><em>Waiting for your answer</em></div></li><li data-i="2"><button type="button" className="fx-dot" tabIndex={-1}><b>3</b><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></i></button><div><small>Step 3</small><span>Who should make the decisions</span><em>Waiting for your answer</em></div></li></ol>
      <p className="fx-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>No contact details needed to see your result.</p>
    </div>
    <div className="fx-card rv d1" id="ffCard" aria-live="polite"></div>
  </div>
</section>
    </>
  );
}
