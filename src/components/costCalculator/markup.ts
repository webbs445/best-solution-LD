import { DISCLAIMER } from "@/content/site";
import { servicesMenuHtml } from "@/components/ui/servicesMenuHtml";

/*
  The /cost-calculator page body, from BestSolution_CostCalculator_LandingPage.html, served as static HTML (CcScript
  wires it up). Advice only (Google Ads policy): the same design with no prices, price lock, residency step, authority
  logos or licence-style marks, English only. The FAQ is filled in on the server. Contact links carry data-area and
  CTAs data-cta-location for the site's click tracking.
*/
export const CC_MARKUP = String.raw`<header class="hd" id="hd">
  <div class="wrap hd-in">
    <a class="brand" href="#top" aria-label="Best Solution"><img src="/brand/wordmark.webp" alt="Best Solution" width="150" height="36"></a>
    <nav class="nav" aria-label="Page sections"><a href="#calculator" data-t="Planner">Planner</a><a href="#compare" data-t="Compare">Compare</a><a href="#faq" data-t="FAQ">FAQ</a>${servicesMenuHtml("ccSvm")}</nav>
    <div class="hd-act">
      <button type="button" class="btn btn-ink sm" id="hdCta" data-cta-location="CC Header - Main"></button>
    </div>
  </div>
</header>

<main id="top">

<section class="hero" aria-labelledby="h1">
  <div class="wrap hero-g">
    <div>
      <span class="kick h-in" style="--k:0" data-t="For founders planning a UAE company">For founders planning a UAE company</span>
      <h1 id="h1"><span class="ln"><span data-t="Plan your budget">Plan your budget</span></span> <span class="ln"><span class="gr" data-t="with an advisor at your side.">with an advisor at your side.</span></span></h1>
      <p class="lead h-in" style="--k:2" data-t="HERO_SUB">Compare mainland, free zone and offshore, choose what fits your plans, and review the cost areas with a Best Solution advisor.</p>
      <div class="hero-cta h-in" style="--k:3"><a class="btn btn-cu" href="#quote" data-cta-location="CC Hero - Book a Consultation"><span data-t="Book a Consultation">Book a Consultation</span><svg class="arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><a class="btn btn-soft" href="https://wa.me/97145531546?text=Hello%2C%20I%20would%20like%20advice%20on%20planning%20my%20UAE%20company%20budget." target="_blank" rel="noopener" data-area="Hero"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z"/></svg><span data-t="WhatsApp an advisor">WhatsApp an advisor</span></a></div>
      <div class="proof h-in" style="--k:4"><span class="avs"><img src="/testimonials/michael-doherty.webp" alt="" width="38" height="38"><img src="/testimonials/hadi-hamedi.webp" alt="" width="38" height="38"></span><span><span data-t="Private advisors in Business Bay, Dubai">Private advisors in Business Bay, Dubai</span></span></div>
      <div class="trust h-in" style="--k:5"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg><span data-t="Advice in plain terms">Advice in plain terms</span></span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg><b id="nOpts">42</b> <span data-t="options compared">options compared</span></span></div>
      <p class="legal" data-legal>${DISCLAIMER}</p>
    </div>
    <div class="mock-w" aria-hidden="true">
      <div class="orb"></div>
      <div class="mock" id="mock">
        <div class="mk-h"><span class="mk-t"><i class="lm"></i><span data-t="Your plan">Your plan</span></span><span class="mk-live"><i></i><span data-t="Live">Live</span></span></div>
        <div class="mk-seg" id="mkSeg"><span class="mk-ind" id="mkInd"></span><b data-t="Mainland">Mainland</b><b data-t="Free zone">Free zone</b><b data-t="Offshore">Offshore</b></div>
        <div class="mk-co" id="mkCo"></div>
        <ul class="mk-l" id="mkL"></ul>
        <div class="mk-tot"><span><small data-t="Your plan">Your plan</small><b id="mkTot"></b></span><span class="mk-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span data-t="Plan my company">Plan my company</span></span></div>
      </div>
      <div class="fchip c1"><i><svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg></i><span><b>Business Bay</b><small data-t="Our office in Dubai">Our office in Dubai</small></span></div>
      <div class="fchip c2"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></i><span data-t="Reviewed with an advisor">Reviewed with an advisor</span></div>
    </div>
  </div>
</section>

<section class="cfg" id="calculator" aria-labelledby="h-calc">
  <div class="wrap">
    <div class="cfg-top">
      <div class="in-a" style="--k:0">
        <span class="kick" data-t="Budget planner">Budget planner</span>
        <h2 id="h-calc"><span data-t="Build your plan.">Build your plan.</span> <span class="gr" data-t="Review it with an advisor.">Review it with an advisor.</span></h2>
      </div>
      <div class="in-a" style="--k:1"><p data-t="CALC_SUB">Six short steps. Your plan card and checklist update with every choice.</p></div>
    </div>

    <div class="cfg-g">
      <aside class="stage in-a" style="--k:2" id="stage" aria-label="Your plan">
        <p class="res-hello" id="resHello"></p>
        <div class="price">
          <div><span class="price-k"><span id="pK"></span><em class="tagx" id="pFrom" hidden></em></span><span class="od" id="od" aria-live="polite"></span></div>
          <div class="yr" role="group"><button type="button" data-y="1" aria-pressed="true" data-t="Now">Now</button><button type="button" data-y="2" aria-pressed="false" data-t="As you grow">As you grow</button></div>
        </div>
        <div class="lic-w"><div class="lic" id="lic" aria-hidden="true">
          <div class="lic-top"><span class="lic-mark"><i class="lm" aria-hidden="true"></i>Best Solution</span><span class="lic-j" id="licJ"></span></div>
          <div class="lic-logo" id="licLogo"></div>
          <p class="lic-act" id="licAct"></p><p class="lic-name" id="licName"></p>
          <div class="lic-meta"><div><small data-t="Emirate">Emirate</small><b id="licE"></b></div><div><small data-t="Team">Team</small><b id="licR"></b></div><div><small data-t="Workspace">Workspace</small><b id="licW"></b></div></div>
          <div class="lic-wm" id="licWm"></div>
        </div></div>
        <div class="pick" id="pick"><p data-t="Choose a jurisdiction">Choose a jurisdiction</p><div id="pickL"></div></div>
        <div class="bar" id="bar" aria-hidden="true"><i class="pkg" style="flex-grow:1"></i><i class="res" style="flex-grow:0"></i><i class="ws" style="flex-grow:0"></i><i class="bank" style="flex-grow:0"></i></div>
        <ul class="lines" id="lines"></ul>
        <div class="elsewhere" id="else" role="group"></div>
        <a class="also" id="also" href="#compare" data-cta-location="CC Result - Also for you"></a>
        <button type="button" class="res-edit" id="resEdit"></button>
        <div class="stage-cta"><button type="button" class="btn btn-cu" id="stCta"></button><a class="btn btn-soft" href="#compare" data-cta-location="CC Stage - Compare" data-t="Compare">Compare</a></div>
        <p class="note" data-t="NOTE">This is a planning aid, not a quote. Costs depend on your activity, team and workspace, and some are set by the authorities. Your advisor reviews them with you.</p>
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
    <div class="sec-h rv"><div><span class="kick" data-t="Jurisdictions">Jurisdictions</span><h2 id="h-cp" data-t="Compare the three structures">Compare the three structures</h2></div><p data-t="CMP_SUB">Your plan in each jurisdiction, side by side. The highlighted column is your current selection.</p></div>
    <div class="cmpt" id="chart" role="table" aria-labelledby="h-cp"></div>
    <p class="cmp-note" data-t="Offshore companies do not trade in the UAE and have no office or staff here, so those parts do not apply.">Offshore companies do not trade in the UAE and have no office or staff here, so those parts do not apply.</p>
  </div>
</section>

<section class="sec alt why" aria-labelledby="h-wy">
  <div class="wrap">
    <div class="sec-h rv"><div><span class="kick" data-t="Why Best Solution">Why Best Solution</span><h2 id="h-wy" data-t="An advisory standard built on clear advice">An advisory standard built on clear advice</h2></div><p data-t="WHY_SUB">Our approach is simple: clear advice, one advisor, and no decision until you are ready.</p></div>
    <div class="why-g">
      <div class="wy rv" style="--d:0"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/></svg></span><h3 data-t="Advice in plain terms">Advice in plain terms</h3><p data-t="We explain your options clearly, so you can compare them and decide.">We explain your options clearly, so you can compare them and decide.</p></div>
      <div class="wy rv" style="--d:1"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><h3 data-t="A dedicated advisor">A dedicated advisor</h3><p data-t="The same advisor from your first call onwards, so you never repeat yourself.">The same advisor from your first call onwards, so you never repeat yourself.</p></div>
      <div class="wy rv" style="--d:2"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18M8 8v.01M8 12v.01M8 16v.01M16 13v.01M16 17v.01"/></svg></span><h3 data-t="Business Bay office">Business Bay office</h3><p data-t="Meet your advisor in person at our office in Business Bay.">Meet your advisor in person at our office in Business Bay.</p></div>
      <div class="wy rv" style="--d:3"><span class="wi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m6.5 6.5 3.4 3.4M17.5 6.5l-3.4 3.4M6.5 17.5l3.4-3.4M17.5 17.5l-3.4-3.4"/></svg></span><h3 data-t="Every jurisdiction">Every jurisdiction</h3><p data-t="Mainland, free zone and offshore across the UAE, so your advisor compares the options for you.">Mainland, free zone and offshore across the UAE, so your advisor compares the options for you.</p></div>
    </div>
    <div class="stats rv">
      <div><b>__STAT_BUSINESSES__</b><span>__STATL_BUSINESSES__</span></div>
      <div><b>__STAT_COUNTRIES__</b><span>__STATL_COUNTRIES__</span></div>
      <div><b>__STAT_TEAM__</b><span>__STATL_TEAM__</span></div>
      <div><b>__STAT_RATING__</b><span>__STATL_RATING__</span></div>
    </div>
    <div class="revs-h rv"><h3 data-t="What clients say">What clients say</h3><a href="https://www.google.com/search?q=Best+Solution+Business+Consultancy+Dubai+reviews" target="_blank" rel="noopener" data-area="Reviews"><span data-t="Read all reviews on Google">Read all reviews on Google</span></a></div>
    <div class="revs">
      <figure class="rq rv" style="--d:0"><div><div class="st" role="img" aria-label="5 out of 5 stars">__STARS__</div><blockquote lang="en" data-review-quote>“25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands.”</blockquote></div><figcaption><img src="/testimonials/michael-doherty.webp" alt="" width="44" height="44" loading="lazy"><span><b>Michael</b><small>Chief Executive Officer, Doherty Capital</small></span></figcaption></figure>
      <figure class="rq rv" style="--d:1"><div><div class="st" role="img" aria-label="5 out of 5 stars">__STARS__</div><blockquote lang="en" data-review-quote>“Everything became structured, professional, and stress-free after switching to Best Solution.”</blockquote></div><figcaption><img src="/testimonials/hadi-hamedi.webp" alt="" width="44" height="44" loading="lazy"><span><b>Hadi</b><small>Chief Executive Officer, Soft Miller</small></span></figcaption></figure>
    </div>
  </div>
</section>

<section class="sec" id="faq" aria-labelledby="h-fq">
  <div class="wrap fq-g">
    <div class="fq-side rv"><span class="kick" data-t="FAQ">FAQ</span><h2 id="h-fq" data-t="Questions about planning your budget">Questions about planning your budget</h2><p data-t="Something else? Message an advisor on WhatsApp.">Something else? Message an advisor on WhatsApp.</p><a class="btn btn-soft" href="https://wa.me/97145531546?text=Hello%2C%20I%20would%20like%20advice%20on%20planning%20my%20UAE%20company%20budget." target="_blank" rel="noopener" data-area="FAQ" data-t="Ask on WhatsApp">Ask on WhatsApp</a></div>
    <div id="faqL">__FAQ__</div>
  </div>
</section>

<section class="sec qt" id="quote" aria-labelledby="h-qt">
  <div class="wrap">
    <div class="sec-h rv"><div><span class="kick" data-t="Consultation">Consultation</span><h2 id="h-qt" data-t="Talk it through with an advisor">Talk it through with an advisor</h2></div><p data-t="Send your plan and an advisor will contact you to arrange a time.">Send your plan and an advisor will contact you to arrange a time.</p></div>
    <div class="qt-g">
      <div class="mini rv">
        <h3 data-t="Your plan">Your plan</h3>
        <div class="sum" id="sum"></div>
        <h4 class="nx-h" data-t="What happens next">What happens next</h4>
        <ol class="nx">
          <li><span>1</span><div><b data-t="Review your options">Review your options</b><p data-t="Your advisor walks you through workspace, team, yearly costs and the structure that fits, and answers your questions.">Your advisor walks you through workspace, team, yearly costs and the structure that fits, and answers your questions.</p></div></li>
          <li><span>2</span><div><b data-t="Decide your next steps">Decide your next steps</b><p data-t="You leave with a clear list of the cost areas to budget for, and decide what to do next in your own time.">You leave with a clear list of the cost areas to budget for, and decide what to do next in your own time.</p></div></li>
        </ol>
      </div>
      <div class="fm rv" id="fm" data-area="Quote Form">
        <h3 data-t="Where can your advisor reach you?">Where can your advisor reach you?</h3>
        <p data-t="Your plan above is attached to your request.">Your plan above is attached to your request.</p>
        <form id="form" novalidate data-track="LP Cost Calculator Quote">
          <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="fl"><input id="fName" name="name" placeholder=" " autocomplete="name"><label for="fName" data-t="Full name">Full name</label><span class="err" data-t="Please enter your name">Please enter your name</span></div>
          <div class="fl"><div class="tel"><select id="fCC" data-ta="Country code" aria-label="Country code"></select><div class="fl-in" style="position:relative"><input id="fPhone" name="phone" type="tel" inputmode="tel" placeholder=" " autocomplete="tel-national"><label for="fPhone" data-t="Phone or WhatsApp">Phone or WhatsApp</label></div></div><span class="err" data-t="Please enter a valid phone number">Please enter a valid phone number</span></div>
          <div class="fl"><input id="fEmail" name="email" type="email" inputmode="email" placeholder=" " autocomplete="email"><label for="fEmail" data-t="Email">Email</label><span class="err" data-t="Please enter a valid email">Please enter a valid email</span></div>
          <button class="btn btn-cu" type="submit" id="fGo" data-t="Book my consultation">Book my consultation</button>
          <p class="ferr" id="fErr" role="alert" hidden data-t="We could not send your details. Please try again, or message us on WhatsApp.">We could not send your details. Please try again, or message us on WhatsApp.</p>
          <p class="priv" data-t="PRIV">Private and confidential. By sending, you agree that Best Solution may contact you by phone, WhatsApp or email.</p>
        </form>
        <div class="done-v" role="status"><div class="tk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3 id="doneH"></h3><p data-t="DONE_SUB">Your advisor will call to arrange your consultation. Which time suits you?</p>
          <div class="chips call-t" id="callT" role="group"><button type="button" class="chip" data-c="morning" aria-pressed="false" data-t="Morning">Morning</button><button type="button" class="chip" data-c="afternoon" aria-pressed="false" data-t="Afternoon">Afternoon</button><button type="button" class="chip" data-c="evening" aria-pressed="false" data-t="Evening">Evening</button></div>
          <p class="call-ok" id="callOk" hidden data-t="Noted. Your advisor will call you then.">Noted. Your advisor will call you then.</p>
          <div class="done-cta"><a class="btn btn-wa wa-setup" id="waSetup" href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Success" data-t="WhatsApp my plan">WhatsApp my plan</a><a class="btn btn-soft" href="tel:+971522330011" data-area="Success" data-t="Call now">Call now</a></div></div>
        <div class="con"><a href="tel:+971522330011" data-area="Quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>+971 52 233 0011</a><a href="mailto:connect@best-solution.ae" data-area="Quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>connect@best-solution.ae</a></div>
      </div>
    </div>
  </div>
</section>

<dialog class="gate" id="gate" aria-labelledby="gH">
  <form id="gForm" novalidate data-track="LP Cost Calculator Price">
    <button type="button" class="x" id="gX" data-ta="Close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <span class="gi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l16-8-6 16-3-6z"/></svg></span>
    <h3 id="gH" data-t="Send your plan to an advisor">Send your plan to an advisor</h3>
    <p class="gp" data-t="An advisor reviews your plan and contacts you to arrange a consultation.">An advisor reviews your plan and contacts you to arrange a consultation.</p>
    <div class="gsum" id="gSum"></div>
    <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="fl"><input id="gName" name="name" placeholder=" " autocomplete="name"><label for="gName" data-t="Full name">Full name</label><span class="err" data-t="Please enter your name">Please enter your name</span></div>
    <div class="fl"><div class="tel"><select id="gCC" data-ta="Country code" aria-label="Country code"></select><div class="fl-in" style="position:relative"><input id="gPhone" name="phone" type="tel" inputmode="tel" placeholder=" " autocomplete="tel-national"><label for="gPhone" data-t="Phone or WhatsApp">Phone or WhatsApp</label></div></div><span class="err" data-t="Please enter a valid phone number">Please enter a valid phone number</span></div>
    <div class="fl"><input id="gEmail" name="email" type="email" inputmode="email" placeholder=" " autocomplete="email"><label for="gEmail" data-t="Email">Email</label><span class="err" data-t="Please enter a valid email">Please enter a valid email</span></div>
    <label class="wa-opt"><input type="checkbox" id="gWa"><span class="bx"></span><span data-t="Send my plan to WhatsApp">Send my plan to WhatsApp</span></label>
    <button class="btn btn-cu" type="submit" id="gGo" data-t="Send to an advisor">Send to an advisor</button>
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
    <p class="gp" data-t="DONE_SUB">Your advisor will call to arrange your consultation. Which time suits you?</p>
    <div class="gsum" id="cSum"></div>
    <div class="chips call-t" role="group"><button type="button" class="chip" data-c="morning" aria-pressed="false" data-t="Morning">Morning</button><button type="button" class="chip" data-c="afternoon" aria-pressed="false" data-t="Afternoon">Afternoon</button><button type="button" class="chip" data-c="evening" aria-pressed="false" data-t="Evening">Evening</button></div>
    <p class="call-ok" hidden data-t="Noted. Your advisor will call you then.">Noted. Your advisor will call you then.</p>
    <div class="done-cta"><a class="btn btn-wa wa-setup" href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Call pop-up" data-t="WhatsApp my plan">WhatsApp my plan</a><a class="btn btn-soft" href="tel:+971522330011" data-area="Call pop-up" data-t="Call now">Call now</a></div>
  </div>
</dialog>

</main>

<footer class="ft">
  <div class="wrap">
    <div class="ft-top">
      <div><img src="/brand/wordmark.webp" alt="Best Solution" width="170" height="42"><p data-t="Private business advisors in Business Bay, Dubai.">Private business advisors in Business Bay, Dubai.</p></div>
      <div><h4 data-t="On this page">On this page</h4><a href="#calculator" data-t="Planner">Planner</a><a href="#compare" data-t="Compare">Compare</a><a href="#faq" data-t="FAQ">FAQ</a><a href="/services">All services</a></div>
      <div><h4 data-t="Contact">Contact</h4><a href="tel:+971522330011" data-area="Footer" dir="ltr">+971 52 233 0011</a><a href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Footer">WhatsApp</a><a href="mailto:connect@best-solution.ae" data-area="Footer">connect@best-solution.ae</a></div>
    </div>
    <p class="ft-legal" data-legal>${DISCLAIMER}</p>
    <div class="ft-bot"><span>© <span id="yr"></span> Best Solution. <span data-t="All rights reserved.">All rights reserved.</span></span><a href="/privacy" style="text-decoration:underline" data-t="Privacy policy">Privacy policy</a> <a href="/terms" style="text-decoration:underline">Terms</a></div>
  </div>
</footer>

<div class="mbar hide" id="mbar"><div class="mbar-t"><span id="mbarK" data-t="Your plan">Your plan</span><b id="mbarV"></b></div><a class="mbar-wa wa-setup" href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Bottom bar" data-ta="WhatsApp my plan" aria-label="WhatsApp my plan"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z"/></svg></a><button type="button" class="btn btn-cu" id="mbarCta"></button></div>
`;
