/*
  The /cost-calculator page body, from BestSolution_CostCalculator_LandingPage.html, served as static HTML (CcScript
  wires it up). Changes from the design file: images from /zones, /brand and /testimonials, the FAQ filled in English on
  the server (CcScript rebuilds it per language). Contact links carry data-area and CTAs data-cta-location for the
  site's click tracking.
*/
export const CC_MARKUP = String.raw`<header class="hd" id="hd">
  <div class="wrap hd-in">
    <a class="brand" href="#top" aria-label="Best Solution"><img src="/brand/logo.webp" alt="Best Solution" width="150" height="36"></a>
    <nav class="nav" aria-label="Page sections"><a href="#calculator" data-t="Calculator">Calculator</a><a href="#compare" data-t="Compare">Compare</a><a href="#faq" data-t="FAQ">FAQ</a></nav>
    <div class="hd-act">
      <div class="lang"><button type="button" id="langBtn" aria-haspopup="true" aria-expanded="false" data-ta="Language" aria-label="Language"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><span id="langCur">EN</span></button><ul id="langMenu" role="menu"></ul></div>
      <button type="button" class="btn btn-ink sm" id="hdCta" data-cta-location="CC Header — Main"></button>
    </div>
  </div>
</header>

<main id="top">

<section class="hero" aria-labelledby="h1">
  <div class="wrap hero-g">
    <div>
      <span class="kick h-in" style="--k:0" data-t="UAE company cost calculator">UAE company cost calculator</span>
      <h1 id="h1"><span class="ln"><span data-t="Plan your UAE company">Plan your UAE company</span></span> <span class="ln"><span class="gr" data-t="with a clear, written fee estimate.">with a clear, written fee estimate.</span></span></h1>
      <p class="lead h-in" style="--k:2" data-t="HERO_SUB">Compare mainland, free zone and offshore, build an itemised first-year estimate, and have every figure confirmed in writing by a Best Solution advisor.</p>
      <div class="hero-cta h-in" style="--k:3"><a class="btn btn-cu" href="#calculator" data-cta-location="CC Hero — Start the calculator"><span data-t="Start the calculator">Start the calculator</span><svg class="arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><a class="btn btn-soft" href="https://wa.me/97145531546?text=Hello%2C%20I%20would%20like%20to%20know%20the%20cost%20of%20setting%20up%20a%20company%20in%20the%20UAE." target="_blank" rel="noopener" data-area="Hero"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z"/></svg><span data-t="WhatsApp an advisor">WhatsApp an advisor</span></a></div>
      <div class="proof h-in" style="--k:4"><span class="avs"><img src="/testimonials/chandra-mohan.webp" alt="" width="38" height="38"><img src="/testimonials/michael-doherty.webp" alt="" width="38" height="38"><img src="/testimonials/hadi-hamedi.webp" alt="" width="38" height="38"></span><span><span class="st" aria-hidden="true">★★★★★</span><span data-t="Trusted by 5,000+ businesses since 2014">Trusted by 5,000+ businesses since 2014</span></span></div>
      <div class="trust h-in" style="--k:5"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg><span data-t="Published rate card">Published rate card</span></span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg><b id="nOpts">42</b> <span data-t="setups">setups</span></span></div>
    </div>
    <div class="mock-w" aria-hidden="true">
      <div class="orb"></div>
      <div class="mock" id="mock">
        <div class="mk-h"><span class="mk-t"><i class="lm"></i><span data-t="Your estimate">Your estimate</span></span><span class="mk-live"><i></i><span data-t="Live">Live</span></span></div>
        <div class="mk-seg" id="mkSeg"><span class="mk-ind" id="mkInd"></span><b data-t="Mainland">Mainland</b><b data-t="Free zone">Free zone</b><b data-t="Offshore">Offshore</b></div>
        <div class="mk-co" id="mkCo"></div>
        <ul class="mk-l" id="mkL"></ul>
        <div class="mk-tot"><span><small data-t="Estimated first-year cost">Estimated first-year cost</small><b>AED <span class="bl">24,500</span></b></span><span class="mk-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span data-t="Show my price">Show my price</span></span></div>
      </div>
      <div class="fchip c1"><i><svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg></i><span><b>4.8</b><small data-t="Google rating · 200+ reviews">Google rating · 200+ reviews</small></span></div>
      <div class="fchip c2"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i><span data-t="Confirmed in writing">Confirmed in writing</span></div>
    </div>
  </div>
</section>

<section class="cfg" id="calculator" aria-labelledby="h-calc">
  <div class="wrap">
    <div class="cfg-top">
      <div class="in-a" style="--k:0">
        <span class="kick" data-t="Cost Calculator">Cost Calculator</span>
        <h2 id="h-calc"><span data-t="Build your setup.">Build your setup.</span> <span class="gr" data-t="Unlock your exact price.">Unlock your exact price.</span></h2>
      </div>
      <div class="in-a" style="--k:1"><p data-t="CALC_SUB">Six short steps. Your licence card and breakdown update with every choice.</p></div>
    </div>

    <div class="cfg-g">
      <aside class="stage in-a" style="--k:2" id="stage" aria-label="Estimate">
        <div class="price">
          <div><span class="price-k"><span id="pK"></span><em class="tagx" id="pFrom" hidden></em></span><span class="od" id="od" aria-live="polite"></span></div>
          <div class="yr" role="group"><button type="button" data-y="1" aria-pressed="true" data-t="Year 1">Year 1</button><button type="button" data-y="2" aria-pressed="false" data-t="Year 2">Year 2</button></div>
        </div>
        <div class="lic-w"><div class="lic" id="lic" aria-hidden="true">
          <div class="lic-top"><span class="lic-mark"><i class="lm" aria-hidden="true"></i>Best Solution</span><span class="lic-j" id="licJ"></span></div>
          <div class="lic-logo" id="licLogo"></div>
          <p class="lic-act" id="licAct"></p><p class="lic-name" id="licName"></p>
          <div class="lic-meta"><div><small data-t="Emirate">Emirate</small><b id="licE"></b></div><div><small data-t="Residency">Residency</small><b id="licR"></b></div><div><small data-t="Workspace">Workspace</small><b id="licW"></b></div></div>
          <div class="lic-wm" id="licWm"></div>
        </div></div>
        <div class="pick" id="pick"><p data-t="Choose where to start">Choose where to start</p><div id="pickL"></div></div>
        <div class="bar" id="bar" aria-hidden="true"><i class="pkg" style="flex-grow:1"></i><i class="res" style="flex-grow:0"></i><i class="ws" style="flex-grow:0"></i><i class="bank" style="flex-grow:0"></i></div>
        <ul class="lines" id="lines"></ul>
        <div class="elsewhere" id="else" role="group"></div>
        <div class="stage-cta"><button type="button" class="btn btn-cu" id="stCta"></button><a class="btn btn-soft" href="#compare" data-cta-location="CC Stage — Compare" data-t="Compare">Compare</a></div>
        <p class="note" data-t="NOTE">"From" prices on our published rate card, 30 Sep 2026. Government fees can change; your consultant confirms the exact figure in writing before you pay anything.</p>
      </aside>

      <div class="panel in-a" style="--k:3" id="studio">
        <div class="tabs" role="tablist" id="tabs"></div>
        <p class="stepn" id="stepN" aria-live="polite"></p>
        <div class="prog" aria-hidden="true"><i id="prog"></i></div>
        <div class="stepv" id="stepv" aria-live="polite"></div>
        <div class="nav2"><button class="btn btn-ghost" type="button" id="back"><svg class="arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="rotate:180deg"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span data-t="Back">Back</span></button><button class="btn btn-ink sm" type="button" id="next"></button></div>
      </div>
    </div>
  </div>
</section>

<section class="sec cmp" id="compare" aria-labelledby="h-cp">
  <div class="wrap">
    <div class="sec-h rv"><div><span class="kick" data-t="Jurisdictions">Jurisdictions</span><h2 id="h-cp" data-t="Compare the three structures">Compare the three structures</h2></div><p data-t="CMP_SUB">Your plan priced in each jurisdiction, side by side. The highlighted column is your current selection.</p></div>
    <div class="cmpt" id="chart" role="table" aria-labelledby="h-cp"></div>
    <p class="cmp-note" data-t="Entry prices from our rate card. Offshore companies cannot hold UAE residency or an office, so those parts do not apply.">Entry prices from our rate card. Offshore companies cannot hold UAE residency or an office, so those parts do not apply.</p>
  </div>
</section>

<section class="sec alt why" aria-labelledby="h-wy">
  <div class="wrap">
    <div class="sec-h rv"><div><span class="kick" data-t="Why Best Solution">Why Best Solution</span><h2 id="h-wy" data-t="An advisory standard built on written fees">An advisory standard built on written fees</h2></div><p data-t="WHY_SUB">We have advised more than 5,000 businesses since 2014. The approach has stayed the same: a clear figure, one advisor, and nothing filed until you agree to the numbers.</p></div>
    <div class="why-g">
      <div class="wy rv" style="--d:0"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/></svg></span><h3 data-t="Fees in writing">Fees in writing</h3><p data-t="Your full fee schedule arrives in writing before anything is filed.">Your full fee schedule arrives in writing before anything is filed.</p></div>
      <div class="wy rv" style="--d:1"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><h3 data-t="One dedicated advisor">One dedicated advisor</h3><p data-t="The same advisor from your first call to your company's first trading day.">The same advisor from your first call to your company's first trading day.</p></div>
      <div class="wy rv" style="--d:2"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18M8 8v.01M8 12v.01M8 16v.01M16 13v.01M16 17v.01"/></svg></span><h3 data-t="Business Bay office">Business Bay office</h3><p data-t="Meet your advisor in person at our Emirati-owned office in Business Bay.">Meet your advisor in person at our Emirati-owned office in Business Bay.</p></div>
      <div class="wy rv" style="--d:3"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m6.5 6.5 3.4 3.4M17.5 6.5l-3.4 3.4M6.5 17.5l3.4-3.4M17.5 17.5l-3.4-3.4"/></svg></span><h3 data-t="Every jurisdiction">Every jurisdiction</h3><p data-t="Mainland, free zone and offshore across the seven emirates, so your advisor compares the options for you.">Mainland, free zone and offshore across the seven emirates, so your advisor compares the options for you.</p></div>
    </div>
    <div class="stats rv">
      <div><b><span class="cnt" data-n="5000">5,000</span><sup>+</sup></b><span data-t="businesses advised since 2014">businesses advised since 2014</span></div>
      <div><b><span class="cnt" data-n="80">80</span><sup>+</sup></b><span data-t="client countries">client countries</span></div>
      <div><b><span class="cnt" data-n="50">50</span><sup>+</sup></b><span data-t="in-house professionals">in-house professionals</span></div>
      <div><b><span>4.8</span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg></b><span data-t="Google rating from 200+ reviews">Google rating from 200+ reviews</span></div>
    </div>
    <div class="revs-h rv"><h3 data-t="What clients say">What clients say</h3><a href="https://www.google.com/search?q=Best+Solution+Business+Consultancy+Dubai+reviews" target="_blank" rel="noopener" data-area="Reviews"><span class="st" aria-hidden="true">★★★★★</span><span data-t="Read all reviews on Google">Read all reviews on Google</span></a></div>
    <div class="revs">
      <figure class="rq rv" style="--d:0"><div><div class="st" aria-label="5 stars">★★★★★</div><blockquote lang="en">“No hidden charges, no surprises. Exactly what was promised, delivered on time.”</blockquote></div><figcaption><img src="/testimonials/chandra-mohan.webp" alt="" width="44" height="44" loading="lazy"><span><b>Chandra Mohan</b><small>Business Development Manager, Prism Advertising</small></span></figcaption></figure>
      <figure class="rq rv" style="--d:1"><div><div class="st" aria-label="5 stars">★★★★★</div><blockquote lang="en">“25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands.”</blockquote></div><figcaption><img src="/testimonials/michael-doherty.webp" alt="" width="44" height="44" loading="lazy"><span><b>Michael Doherty</b><small>Chief Executive Officer, Doherty Capital</small></span></figcaption></figure>
      <figure class="rq rv" style="--d:2"><div><div class="st" aria-label="5 stars">★★★★★</div><blockquote lang="en">“Everything became structured, professional, and stress-free after switching to Best Solution.”</blockquote></div><figcaption><img src="/testimonials/hadi-hamedi.webp" alt="" width="44" height="44" loading="lazy"><span><b>Hadi Hamedi</b><small>Chief Executive Officer, Soft Miller</small></span></figcaption></figure>
    </div>
  </div>
</section>

<section class="sec" id="faq" aria-labelledby="h-fq">
  <div class="wrap fq-g">
    <div class="fq-side rv"><span class="kick" data-t="FAQ">FAQ</span><h2 id="h-fq" data-t="Questions about the cost">Questions about the cost</h2><p data-t="Something else? Message a consultant on WhatsApp.">Something else? Message a consultant on WhatsApp.</p><a class="btn btn-soft" href="https://wa.me/97145531546?text=Hello%2C%20I%20have%20a%20question%20about%20company%20setup%20costs." target="_blank" rel="noopener" data-area="FAQ" data-t="Ask on WhatsApp">Ask on WhatsApp</a></div>
    <div id="faqL">__FAQ__</div>
  </div>
</section>

<section class="sec qt" id="quote" aria-labelledby="h-qt">
  <div class="wrap">
    <div class="sec-h rv"><div><span class="kick" data-t="Written quote">Written quote</span><h2 id="h-qt" data-t="Lock in your figure">Lock in your figure</h2></div><p data-t="Send your setup and a consultant confirms the exact cost in writing, with what is included and what is not.">Send your setup and a consultant confirms the exact cost in writing, with what is included and what is not.</p></div>
    <div class="qt-g">
      <div class="mini rv">
        <h3 data-t="Your setup">Your setup</h3>
        <div class="sum" id="sum"></div>
        <h4 class="nx-h" data-t="What happens next">What happens next</h4>
        <ol class="nx">
          <li><span>1</span><div><b data-t="Get it in writing">Get it in writing</b><p data-t="A consultant checks your business activity and confirms the exact figure in writing, before you pay.">A consultant checks your business activity and confirms the exact figure in writing, before you pay.</p></div></li>
          <li><span>2</span><div><b data-t="We handle the rest">We handle the rest</b><p data-t="Licence, residency, workspace and the bank account application, by one team in Business Bay.">Licence, residency, workspace and the bank account application, by one team in Business Bay.</p></div></li>
        </ol>
      </div>
      <div class="fm rv" id="fm" data-area="Quote Form">
        <h3 data-t="Where should we send it?">Where should we send it?</h3>
        <p data-t="Your setup above is attached to your request.">Your setup above is attached to your request.</p>
        <form id="form" novalidate data-track="LP Cost Calculator Quote">
          <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="fl"><input id="fName" name="name" placeholder=" " autocomplete="name"><label for="fName" data-t="Full name">Full name</label><span class="err" data-t="Please enter your name">Please enter your name</span></div>
          <div class="fl"><div class="tel"><select id="fCC" data-ta="Country code" aria-label="Country code"></select><div class="fl-in" style="position:relative"><input id="fPhone" name="phone" type="tel" inputmode="tel" placeholder=" " autocomplete="tel-national"><label for="fPhone" data-t="Phone or WhatsApp">Phone or WhatsApp</label></div></div><span class="err" data-t="Please enter a valid phone number">Please enter a valid phone number</span></div>
          <div class="fl"><input id="fEmail" name="email" type="email" inputmode="email" placeholder=" " autocomplete="email"><label for="fEmail" data-t="Email">Email</label><span class="err" data-t="Please enter a valid email">Please enter a valid email</span></div>
          <button class="btn btn-cu" type="submit" id="fGo" data-t="Send me my written quote">Send me my written quote</button>
          <p class="ferr" id="fErr" role="alert" hidden data-t="We could not send your details. Please try again, or message us on WhatsApp.">We could not send your details. Please try again, or message us on WhatsApp.</p>
          <p class="priv" data-t="PRIV">Private and confidential. By sending, you agree that Best Solution may contact you by phone, WhatsApp or email.</p>
        </form>
        <div class="done-v" role="status"><div class="tk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3 id="doneH"></h3><p data-t="DONE_SUB">Your advisor will call to confirm your exact figure in writing. When suits you best?</p>
          <div class="chips call-t" id="callT" role="group"><button type="button" class="chip" data-c="morning" aria-pressed="false" data-t="Morning">Morning</button><button type="button" class="chip" data-c="afternoon" aria-pressed="false" data-t="Afternoon">Afternoon</button><button type="button" class="chip" data-c="evening" aria-pressed="false" data-t="Evening">Evening</button></div>
          <p class="call-ok" id="callOk" hidden data-t="Noted. Your advisor will call you then.">Noted. Your advisor will call you then.</p>
          <div class="done-cta"><a class="btn btn-wa wa-setup" id="waSetup" href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Success" data-t="WhatsApp my setup">WhatsApp my setup</a><a class="btn btn-soft" href="tel:+971522330011" data-area="Success" data-t="Call now">Call now</a></div></div>
        <div class="con"><a href="tel:+971522330011" data-area="Quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>+971 52 233 0011</a><a href="mailto:connect@best-solution.ae" data-area="Quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>connect@best-solution.ae</a></div>
      </div>
    </div>
  </div>
</section>

<dialog class="gate" id="gate" aria-labelledby="gH">
  <form id="gForm" novalidate data-track="LP Cost Calculator Price">
    <button type="button" class="x" id="gX" data-ta="Close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <span class="gi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>
    <h3 id="gH" data-t="See your full price">See your full price</h3>
    <p class="gp" data-t="Your price opens straight away. A consultant can then confirm the exact figure in writing, free.">Your price opens straight away. A consultant can then confirm the exact figure in writing, free.</p>
    <div class="gsum" id="gSum"></div>
    <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="fl"><input id="gName" name="name" placeholder=" " autocomplete="name"><label for="gName" data-t="Full name">Full name</label><span class="err" data-t="Please enter your name">Please enter your name</span></div>
    <div class="fl"><div class="tel"><select id="gCC" data-ta="Country code" aria-label="Country code"></select><div class="fl-in" style="position:relative"><input id="gPhone" name="phone" type="tel" inputmode="tel" placeholder=" " autocomplete="tel-national"><label for="gPhone" data-t="Phone or WhatsApp">Phone or WhatsApp</label></div></div><span class="err" data-t="Please enter a valid phone number">Please enter a valid phone number</span></div>
    <div class="fl"><input id="gEmail" name="email" type="email" inputmode="email" placeholder=" " autocomplete="email"><label for="gEmail" data-t="Email">Email</label><span class="err" data-t="Please enter a valid email">Please enter a valid email</span></div>
    <label class="wa-opt"><input type="checkbox" id="gWa"><span class="bx"></span><span data-t="Send my breakdown to WhatsApp">Send my breakdown to WhatsApp</span></label>
    <button class="btn btn-cu" type="submit" id="gGo" data-t="Show my price">Show my price</button>
    <p class="sure"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="m9 12 2 2 4-4"/></svg><span data-t="One advisor contacts you. No spam.">One advisor contacts you. No spam.</span><a href="#faq" id="whyAsk" data-t="Why we ask">Why we ask</a></p>
    <p class="ferr" id="gErr" role="alert" hidden data-t="We could not send your details. Please try again, or message us on WhatsApp.">We could not send your details. Please try again, or message us on WhatsApp.</p>
    <p class="priv" data-t="PRIV">Private and confidential. By sending, you agree that Best Solution may contact you by phone, WhatsApp or email.</p>
  </form>
</dialog>

<dialog class="gate" id="callD" aria-labelledby="cH">
  <div class="cd">
    <button type="button" class="x" id="cX" data-ta="Close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <span class="gi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></span>
    <h3 id="cH" data-t="When should your advisor call?">When should your advisor call?</h3>
    <p class="gp" data-t="DONE_SUB">Your advisor will call to confirm your exact figure in writing. When suits you best?</p>
    <div class="gsum" id="cSum"></div>
    <div class="chips call-t" role="group"><button type="button" class="chip" data-c="morning" aria-pressed="false" data-t="Morning">Morning</button><button type="button" class="chip" data-c="afternoon" aria-pressed="false" data-t="Afternoon">Afternoon</button><button type="button" class="chip" data-c="evening" aria-pressed="false" data-t="Evening">Evening</button></div>
    <p class="call-ok" hidden data-t="Noted. Your advisor will call you then.">Noted. Your advisor will call you then.</p>
    <div class="done-cta"><a class="btn btn-wa wa-setup" href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Call pop-up" data-t="WhatsApp my setup">WhatsApp my setup</a><a class="btn btn-soft" href="tel:+971522330011" data-area="Call pop-up" data-t="Call now">Call now</a></div>
  </div>
</dialog>

</main>

<footer class="ft">
  <div class="wrap">
    <div class="ft-top">
      <div><img src="/brand/logo.webp" alt="Best Solution" width="170" height="42"><p data-t="Business setup consultants in Business Bay, Dubai: mainland, free zone and offshore companies, residency and banking.">Business setup consultants in Business Bay, Dubai: mainland, free zone and offshore companies, residency and banking.</p></div>
      <div><h4 data-t="On this page">On this page</h4><a href="#calculator" data-t="Calculator">Calculator</a><a href="#compare" data-t="Compare">Compare</a><a href="#faq" data-t="FAQ">FAQ</a></div>
      <div><h4 data-t="Contact">Contact</h4><a href="tel:+971522330011" data-area="Footer" dir="ltr">+971 52 233 0011</a><a href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Footer">WhatsApp</a><a href="mailto:connect@best-solution.ae" data-area="Footer">connect@best-solution.ae</a></div>
    </div>
    <p class="ft-legal" data-t="LEGAL">Best Solution® is a private business consultancy based in Business Bay, Dubai. We are not affiliated with any government entity. Licences, residency and bank accounts are approved solely by the relevant authorities and banks. Prices are "from" prices on our published rate card and can change with government fees; the exact figure is confirmed in writing after a consultation.</p>
    <div class="ft-bot"><span>© <span id="yr"></span> Best Solution®. <span data-t="All rights reserved.">All rights reserved.</span></span><a href="https://best-solution.ae/privacy-policy" style="text-decoration:underline" data-t="Privacy policy">Privacy policy</a></div>
  </div>
</footer>

<div class="mbar hide" id="mbar"><div><span data-t="Your estimate">Your estimate</span><b id="mbarV"></b></div><button type="button" class="btn btn-cu" id="mbarCta"></button></div>
`;
