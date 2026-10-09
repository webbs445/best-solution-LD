/* Drag-to-compare: held in your name vs held in a structure. Converted from the structuring landing page HTML. */
export function SpvWhy() {
  return (
    <>
<section className="sec s-paper" id="why">
  <div className="wrap">
    <div className="idx rv"><b>01</b>Why structure</div>
    <div className="cmp-h">
      <h2 className="rv">Same assets. <span className="light-w">Very different future.</span></h2>
      <p className="lede rv d1">An account holds money. A structure decides who controls it, who inherits it and what happens when life changes. Drag to compare.</p>
    </div>
    <div className="slider rv" id="slider">
      <div className="pane wo"><div className="in">
        <span className="pl">Held in your name</span>
        <h3 style={{ marginTop: "10px" }}>Simple, until it isn&apos;t.</h3>
        <ul>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></i>Transfer to family can be unclear</li>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></i>One problem can reach everything</li>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></i>Every decision depends on you</li>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></i>Each new venture handled from scratch</li>
        </ul>
      </div></div>
      <div className="pane wi"><div className="in">
        <span className="pl">Held in a structure</span>
        <h3 style={{ marginTop: "10px" }}>Planned, protected, passed on.</h3>
        <ul>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></i>Written rules on who inherits and when</li>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></i>Assets held apart from trading activity</li>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></i>Governance set out in writing</li>
          <li><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg></i>New ventures plug into one holding</li>
        </ul>
      </div></div>
      <div className="handle" aria-hidden="true"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" /></svg></i></div>
      <input type="range" min="0" max="100" defaultValue="50" aria-label="Compare without and with a structure" id="slR" />
    </div>
    <p className="hint">Drag the handle</p>
  </div>
</section>
    </>
  );
}
