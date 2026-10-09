/* Hero with the animated structure map (labels filled in by SpvMotion). Converted from the structuring landing page HTML. */
export function SpvHero() {
  return (
    <>
<section className="hero" id="hero">
  <div className="aur" aria-hidden="true"><i></i><i></i><i></i></div>
  <div className="wrap hero-g">
    <div className="hero-l">
      <span className="tag"><i>FREE</i>Consultation with our structuring team</span>
      <h1 id="h1">Your assets need <br />a <span className="cu">structure,</span> <br /><span className="light-w">not just a bank account.</span></h1>
      <p className="lede">Foundations, SPVs and holding companies decide who controls your assets, how they pass to your family and how you grow across borders. We help you choose the right one.</p>
      <div className="hero-cta">
        <a className="btn btn-cu" href="#consult" data-cta-location="SPV Hero Book">Book a free consultation <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
        <a className="btn btn-ln" href="#fit" data-cta-location="SPV Hero Find">Find your structure</a>
      </div>
      <div className="hero-facts">
        <span><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /></svg></i><span><b>Private</b>one-to-one advice</span></span>
        <span><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg></i><span><b>Five UAE jurisdictions</b>compared side by side</span></span>
        <span><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></svg></i><span><b>Written</b>plan and fees</span></span>
      </div>
    </div>

    <div className="map" aria-label="Illustration of how a structure can be organised">
      <div className="map-top">
        <small><i></i>See it structured</small>
        <div className="seg" id="mapSeg" role="tablist" aria-label="Example structures">
          <span className="ink" id="mapInk"></span>
          <button role="tab" aria-selected="true" data-s="family">Family wealth</button>
          <button role="tab" aria-selected="false" data-s="property">Property</button>
          <button role="tab" aria-selected="false" data-s="business">Business group</button>
        </div>
      </div>
      <svg id="mapSvg" viewBox="0 0 560 420" role="img" aria-label="Structure diagram">
        <defs>
          <linearGradient id="wg" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="360"><stop offset="0" stopColor="#f0c4ac" /><stop offset="1" stopColor="#cc8667" /></linearGradient>
          <linearGradient id="ng" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e2a684" /><stop offset=".5" stopColor="#cc8667" /><stop offset="1" stopColor="#a96a4d" /></linearGradient>
        </defs>
        <path id="w1" className="wire" d="M280 72 V140" />
        <path id="w2" className="wire" d="M280 196 V250" />
        <path id="w3" className="wire" d="M280 306 C280 330 100 322 100 348" />
        <path id="w4" className="wire" d="M280 306 V348" />
        <path id="w5" className="wire" d="M280 306 C280 330 460 322 460 348" />
        <path className="wire-hi" d="M280 72 V140" />
        <path className="wire-hi" d="M280 196 V250" />
        <path className="wire-hi" d="M280 306 C280 330 100 322 100 348" />
        <path className="wire-hi" d="M280 306 V348" />
        <path className="wire-hi" d="M280 306 C280 330 460 322 460 348" />
        <circle className="dot" r="3.5"><animateMotion dur="2.2s" repeatCount="indefinite"><mpath href="#w1" /></animateMotion></circle>
        <circle className="dot" r="3.5"><animateMotion dur="2.2s" begin=".7s" repeatCount="indefinite"><mpath href="#w2" /></animateMotion></circle>
        <circle className="dot" r="3"><animateMotion dur="2.6s" begin="1.2s" repeatCount="indefinite"><mpath href="#w3" /></animateMotion></circle>
        <circle className="dot" r="3"><animateMotion dur="2.2s" begin="1.4s" repeatCount="indefinite"><mpath href="#w4" /></animateMotion></circle>
        <circle className="dot" r="3"><animateMotion dur="2.6s" begin="1.6s" repeatCount="indefinite"><mpath href="#w5" /></animateMotion></circle>
        <g className="node" data-n="0"><rect x="180" y="16" width="200" height="56" rx="16" /><text x="280" y="42" textAnchor="middle"></text><text className="sub" x="280" y="60" textAnchor="middle"></text></g>
        <g className="node key" data-n="1"><rect x="170" y="140" width="220" height="56" rx="16" /><text x="280" y="166" textAnchor="middle"></text><text className="sub" x="280" y="184" textAnchor="middle"></text></g>
        <g className="node" data-n="2"><rect x="180" y="250" width="200" height="56" rx="16" /><text x="280" y="276" textAnchor="middle"></text><text className="sub" x="280" y="294" textAnchor="middle"></text></g>
        <g className="node" data-n="3"><rect x="30" y="348" width="140" height="56" rx="14" /><text x="100" y="374" textAnchor="middle"></text><text className="sub" x="100" y="392" textAnchor="middle"></text></g>
        <g className="node" data-n="4"><rect x="210" y="348" width="140" height="56" rx="14" /><text x="280" y="374" textAnchor="middle"></text><text className="sub" x="280" y="392" textAnchor="middle"></text></g>
        <g className="node" data-n="5"><rect x="390" y="348" width="140" height="56" rx="14" /><text x="460" y="374" textAnchor="middle"></text><text className="sub" x="460" y="392" textAnchor="middle"></text></g>
      </svg>
      <div className="map-cap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg><span id="mapCap"></span></div>
      <p className="map-note">Illustration only. Your structure depends on your goals and assets.</p>
    </div>
  </div>
</section>
    </>
  );
}
