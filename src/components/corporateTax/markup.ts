/*
  The /corporate-tax page body, from BestSolution_CorporateTax_LandingPage.html, served as static HTML (CtScript wires it up).
  Changes from the design file: logos from /brand, the GTM noscript left to the layout, contact links tagged with
  data-area and CTAs with data-cta-location for the site's click tracking, and the FAQ filled from content.
*/
export const CT_MARKUP = String.raw`<div class="prog" id="prog"></div><div class="cur-ring" id="curR"></div><div class="cur-dot" id="curD"></div>

<header class="hd" id="hd">
  <div class="wrap hd-in">
    <a class="brand" href="#top" aria-label="Best Solution home"><img src="/brand/logo.webp" alt="Best Solution" width="90" height="40"></a>
    <nav class="hd-nav" aria-label="Page sections">
      <a href="#top">Due date</a><a href="#estimate">Estimate</a><a href="#apply">Does it apply</a><a href="#late">Penalties</a><a href="#faq">FAQ</a>
    </nav>
    <div class="hd-act">
      <a class="ico" href="https://wa.me/97145531546?text=Hello%2C%20I%20would%20like%20advice%20on%20UAE%20Corporate%20Tax." target="_blank" rel="noopener" aria-label="Chat on WhatsApp" data-area="Header"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3z"/></svg></a>
      <a class="btn btn-ink sm" href="#book" data-cta-location="CT Header Book">Book a free tax review</a>
      <button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="drawer"><span></span></button>
    </div>
  </div>
</header>
<nav class="drawer" id="drawer" aria-label="Mobile menu">
  <a href="#top">Due date</a><a href="#estimate">Estimate your tax</a><a href="#apply">Does it apply to me</a><a href="#late">Penalties</a><a href="#faq">FAQ</a>
  <a class="btn btn-ink" href="#book" data-cta-location="CT Drawer Book">Book a free tax review</a>
</nav>

<main id="top">

<!-- HERO -->
<section class="hero" aria-labelledby="h1">
  <div class="hbg" aria-hidden="true"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="hgrid"></div></div>
  <div class="wrap hero-g">
    <div class="hero-t">
      <p class="hero-pre"><i></i><span>Free Corporate Tax review<span class="hide-s"> with our Business Bay team</span></span></p>
      <h1 id="h1" class="h1x split"><span class="l1">When is your Corporate Tax</span> <span class="l2">return due?</span></h1>
      <p class="lede">Turn the dial to the month your financial year ends. You'll see your due date, the days you have left and the months you have to file and pay.</p>
      <div class="hero-cta">
        <a class="btn btn-cu idle" href="#book" data-cta-location="CT Hero Book">Book a free tax review</a>
        <a class="btn btn-line" href="#estimate" data-cta-location="CT Hero Estimate">Estimate your tax</a>
      </div>
      <ul class="htr" id="htr"><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg><span>Office in <b>Business Bay</b></span></li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg><span>Fees <b>in writing</b> first</span></li></ul>
      <dl class="hero-facts">
        <div><dt>9%</dt><dd>on profit above<br>AED 375,000</dd></div>
        <div><dt>9 months</dt><dd>after year end<br>to file and pay</dd></div>
        <div><dt>7 years</dt><dd>to keep your<br>records</dd></div>
      </dl>
    </div>

    <div class="dial-wrap">
      <div class="stage" id="stage"><div class="dial-glow"></div><div class="fchip fc1" data-d="1.2"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 5L5 19M7 7h.01M17 17h.01"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></svg></i><span><b>0% to AED 375,000</b>9% on profit above</span></div><div class="fchip fc2" data-d="-1.6"><i class="n"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg></i><span><b>Small Business Relief</b>Periods ending by 31 Dec 2029</span></div><div class="fchip fc3" data-d="0.9"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></i><span><b>9 months</b>to file and pay</span></div>
      <div class="dial" id="dial" tabindex="0" role="slider" aria-label="Month your financial year ends" aria-valuemin="1" aria-valuemax="12" aria-valuenow="12" aria-valuetext="December">
        <svg id="dialSvg" viewBox="0 0 440 440" aria-hidden="true"></svg>
        <div class="dial-c" aria-live="polite">
          <span class="dc-k">Return and payment due</span>
          <strong id="dcDue">30 Sep 2027</strong>
          <span class="dc-left" id="dcLeft"><b>356</b> days left</span>
          <span class="dc-st" id="dcSt">On track</span>
        </div>
      </div>
      </div>
      <div class="dial-ctrl">
        <div class="seg" role="radiogroup" aria-label="Year your financial year ends" id="yrSeg"></div>
        <p class="dial-per" id="dcPer">Tax period 1 Jan to 31 Dec 2026</p>
      </div>
      <ul class="dial-key"><li><i class="k-p"></i>Tax period</li><li><i class="k-f"></i>9 months to file and pay</li><li><i class="k-t"></i>Today</li></ul>
    </div>
  </div>
</section>

<div class="mq" aria-hidden="true"><div class="mq-band mq-b1"><div class="mq-row"><span>Corporate Tax number<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Annual return<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Small Business Relief<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Free zone 0%<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Penalty review<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Corporate Tax number<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Annual return<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Small Business Relief<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Free zone 0%<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Penalty review<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span></div></div><div class="mq-band mq-b2"><div class="mq-row"><span>Bookkeeping<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Tax computation<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Audited accounts<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Records for 7 years<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Tax review<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Bookkeeping<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Tax computation<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Audited accounts<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Records for 7 years<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span><span>Tax review<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z"/></svg></span></div></div></div>

<!-- ESTIMATE -->
<section class="sec cx" id="estimate" aria-labelledby="h-est">
  <div class="est-wm" aria-hidden="true">9%</div><div class="cx-glow" aria-hidden="true"></div>
  <div class="wrap">
    <div class="sec-h"><h2 id="h-est" class="split">Work out your Corporate Tax the way the return does</h2><p>Corporate Tax is not 9% of your profit. It begins with the profit in your accounts, adjusts it, uses any losses, and only then taxes what is above AED 375,000 at 9%.</p></div>
    <ol class="cx-flow cxf" aria-label="How Corporate Tax is worked out"><li><i>1</i><b>Accounting profit</b></li><li><i>2</i><b>Adjust</b></li><li><i>3</i><b>Use losses</b></li><li><i>4</i><b>Taxable income</b></li><li><i>5</i><b>0% / 9%</b></li></ol>
    <div class="cx-sc"><span>Try an example</span><div class="cx-sc-b" id="scen"><button type="button" data-s="trade">Small trading company</button><button type="button" data-s="consult">Growing consultancy</button><button type="button" data-s="fz">Free zone exporter</button></div></div>
    <a class="cx-mini" id="cxMini" href="#sheet"><span>Approx. tax</span><b>AED <span id="miniTax">0</span></b><em id="miniCta">See the working</em></a>
    <div class="cx-g">
      <div class="cx-in">
        <div class="cg"><div class="cg-h"><i>1</i><b>Your figures</b></div>
          <div class="cx-mode" role="radiogroup" aria-label="Tax regime" id="cxMode"><button type="button" role="radio" aria-checked="true" data-m="std">Mainland or standard free zone</button><button type="button" role="radio" aria-checked="false" data-m="qfzp">Qualifying Free Zone Person</button></div>
          <label class="cf" for="cRev"><span class="cf-t"><b>Revenue</b><small>Total revenue for the year</small></span><span class="cf-in"><em>AED</em><input id="cRev" inputmode="numeric" autocomplete="off" value="2,000,000"></span></label>
          <label class="cf" for="cNp"><span class="cf-t"><b>Net profit</b><small>Profit before tax, from your financial statements</small></span><span class="cf-in"><em>AED</em><input id="cNp" inputmode="numeric" autocomplete="off" value="600,000"></span></label>
          <div class="cg-q"><label class="cf" for="cNqi"><span class="cf-t"><b>Non-qualifying income</b><small>Profit from activities that do not qualify. Taxed at 9%</small></span><span class="cf-in"><em>AED</em><input id="cNqi" inputmode="numeric" autocomplete="off" value="120,000"></span></label><label class="cf" for="cNqr"><span class="cf-t"><b>Non-qualifying revenue</b><small>For the limit: 5% of revenue or AED 5 million, whichever is lower</small></span><span class="cf-in"><em>AED</em><input id="cNqr" inputmode="numeric" autocomplete="off" value="150,000"></span></label></div>
          <label class="tg" id="tgSbr"><input type="checkbox" id="cSbr"><span class="tg-s"></span><span class="tg-t"><b>Your revenue may qualify for Small Business Relief</b><small id="sbrHint">Switch it on to compare. For tax periods ending by 31 Dec 2029.</small></span></label>
        </div>
        <button type="button" class="cx-more" id="cxMore" aria-expanded="false" aria-controls="cxAdv"><span aria-hidden="true"></span>Add adjustments and losses<small>Optional</small></button>
        <div class="cx-adv" id="cxAdv"><div>
          <div class="cg"><div class="cg-h"><i>2</i><b>Adjustments</b></div><label class="cf" for="cEnt"><span class="cf-t"><b>Entertainment spend</b><small>Client meals and hospitality. Half is added back</small></span><span class="cf-in"><em>AED</em><input id="cEnt" inputmode="numeric" autocomplete="off" value="0"></span></label><label class="cf" for="cFin"><span class="cf-t"><b>Fines and penalties</b><small>Added back in full</small></span><span class="cf-in"><em>AED</em><input id="cFin" inputmode="numeric" autocomplete="off" value="0"></span></label><label class="cf" for="cEx"><span class="cf-t"><b>Exempt income</b><small>Dividends and gains from qualifying shareholdings</small></span><span class="cf-in"><em>AED</em><input id="cEx" inputmode="numeric" autocomplete="off" value="0"></span></label></div>
          <div class="cg"><div class="cg-h"><i>3</i><b>Losses from earlier years</b></div><label class="cf" for="cLoss"><span class="cf-t"><b>Tax losses brought forward</b><small>Can cut taxable income by up to 75%</small></span><span class="cf-in"><em>AED</em><input id="cLoss" inputmode="numeric" autocomplete="off" value="0"></span></label></div>
        </div></div>
      </div>
      <div class="sheet" id="sheet" aria-live="polite"><div class="stamp" id="stamp" aria-hidden="true"><svg viewBox="0 0 126 126"><defs><path id="spc" d="M63 63m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs><circle cx="63" cy="63" r="60" fill="#14253e"/><circle cx="63" cy="63" r="55" fill="none" stroke="#cc8667" stroke-width="1.5" stroke-dasharray="2 4"/><g class="sp"><text font-size="10.5" font-weight="700" letter-spacing="2.6" fill="#f0c4ac"><textPath href="#spc">ILLUSTRATION ✦ HEADLINE RATES ✦ UAE ✦ </textPath></text></g><text x="63" y="60" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" letter-spacing="-1">9%</text><text x="63" y="77" text-anchor="middle" font-size="9" font-weight="600" fill="#e2a684" letter-spacing="1">ABOVE 375K</text></svg></div>
        <div class="cx-tot"><div><span>Estimated Corporate Tax (approximate)</span><b><small>AED</small><span id="shTax">0</span></b><em class="tp">Tax period ending <span id="shYe">31 Dec 2026</span></em></div>
          <div class="gauge" aria-hidden="true"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" class="g-t"/><circle cx="42" cy="42" r="34" class="g-f" id="gF" pathLength="100"/></svg><span><b id="shEff">0%</b>of net profit</span></div></div>
        <p class="cx-approx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><span><b>An approximate figure, not your final tax.</b> Your actual Corporate Tax depends on your full accounts and the adjustments in your return. For an exact figure, <a href="#book" data-cta-location="CT Estimate — Exact figure from an advisor">talk to our tax team</a>.</span></p><div class="cx-lock" id="cxLock"><span class="cx-lock-i" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span><div class="cx-lock-t"><b>Your estimate is ready</b><p>Enter your details to see your approximate Corporate Tax, what it means for you and the full working. Free, with no obligation.</p></div><button type="button" class="btn btn-cu" id="lockBtn" data-cta-location="CT Estimate — Show my tax estimate">Show my tax estimate</button></div><div class="cx-why"><b>What this means</b><ul id="why"></ul></div>
        <button type="button" class="wk-b" id="wkB" aria-expanded="false" aria-controls="wk">See the working<i></i></button>
        <div class="wk" id="wk"><div><ul class="wf" id="wf"><li class="wf-r base" data-r="np"><div><div class="wf-h"><span class="wf-l">Net profit in your accounts<small data-s="np"></small></span><span class="wf-a" data-k="np">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r add" data-r="ent"><div><div class="wf-h"><span class="wf-l">Add: 50% of entertainment<small data-s="ent">Half of entertainment is not deductible</small></span><span class="wf-a" data-k="ent">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r add" data-r="fin"><div><div class="wf-h"><span class="wf-l">Add: fines and penalties<small data-s="fin">Never deductible</small></span><span class="wf-a" data-k="fin">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r sub" data-r="ex"><div><div class="wf-h"><span class="wf-l">Less: exempt income<small data-s="ex">Qualifying dividends and gains</small></span><span class="wf-a" data-k="ex">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r tot" data-r="adj"><div><div class="wf-h"><span class="wf-l">Adjusted profit<small data-s="adj"></small></span><span class="wf-a" data-k="adj">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r sub" data-r="loss"><div><div class="wf-h"><span class="wf-l">Less: tax losses used<small data-s="loss">Capped at 75% of adjusted profit</small></span><span class="wf-a" data-k="loss">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r tot" data-r="ti"><div><div class="wf-h"><span class="wf-l">Taxable income<small data-s="ti"></small></span><span class="wf-a" data-k="ti">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r sub" data-r="sbr"><div><div class="wf-h"><span class="wf-l">Small Business Relief<small data-s="sbr">Treated as no taxable income</small></span><span class="wf-a" data-k="sbr">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r zero" data-r="b0"><div><div class="wf-h"><span class="wf-l">Taxed at 0%<small data-s="b0">First AED 375,000</small></span><span class="wf-a" data-k="b0">0</span></div><div class="wf-t"><i></i></div></div></li><li class="wf-r nine" data-r="b9"><div><div class="wf-h"><span class="wf-l">Taxed at 9%<small data-s="b9">Everything above AED 375,000</small></span><span class="wf-a" data-k="b9">0</span></div><div class="wf-t"><i></i></div></div></li></ul></div></div>
        <p class="cx-due">Return and payment due by <b id="shDue">30 Sep 2027</b>, based on the year end on your dial.</p>
        <div class="sh-cta"><a class="btn btn-cu" href="#book" id="shCta" data-cta-location="CT Estimate Book">Check these figures with an advisor</a></div>
        <p class="sh-note">An illustration of the standard steps. Your return may need other adjustments, such as interest limits, related party pricing or foreign tax credits.</p>
      </div>
    </div>
  </div>
</section>

<!-- APPLY -->
<section class="sec" id="apply" aria-labelledby="h-ap">
  <div class="wrap">
    <div class="sec-h"><h2 id="h-ap" class="split">Does Corporate Tax apply to you?</h2><p>Answer two questions. You'll get a short list of what you need to do and by when.</p></div>
    <div class="ap-g">
      <div>
        <div class="q"><p><i>1</i>How does your business trade?</p>
          <div class="opts" role="radiogroup" aria-label="Business type" id="apT">
            <button class="opt" role="radio" aria-checked="true" data-v="mainland"><b>Mainland company</b><small>Trading in the UAE market</small></button>
            <button class="opt" role="radio" aria-checked="false" data-v="freezone"><b>Free zone company</b><small>Expecting 0% on some income</small></button>
            <button class="opt" role="radio" aria-checked="false" data-v="person"><b>In my own name</b><small>Freelancer or sole trader</small></button>
            <button class="opt" role="radio" aria-checked="false" data-v="holding"><b>Holding company</b><small>Owning shares or investments</small></button>
          </div>
        </div>
        <div class="q"><p><i>2</i>What is your annual revenue?</p>
          <div class="opts" role="radiogroup" aria-label="Annual revenue" id="apR">
            <button class="opt" role="radio" aria-checked="false" data-v="1"><b>Up to AED 1 million</b></button>
            <button class="opt" role="radio" aria-checked="true" data-v="3"><b>AED 1M to 3M</b></button>
            <button class="opt" role="radio" aria-checked="false" data-v="50"><b>AED 3M to 50M</b></button>
            <button class="opt" role="radio" aria-checked="false" data-v="51"><b>Above AED 50M</b></button>
          </div>
        </div>
      </div>
      <div class="ap-res" aria-live="polite">
        <h3 id="apH">Mainland company, AED 1M to 3M</h3>
        <p id="apP">Here is what applies to you.</p>
        <ul class="ap-list" id="apList"></ul>
        <a class="btn btn-ink" href="#book" id="apCta" data-cta-location="CT Apply Book">Review my case for free</a>
      </div>
    </div>
  </div>
</section>

<!-- LATE -->
<section class="sec late" id="late" aria-labelledby="h-lt">
  <div class="wrap">
    <div class="sec-h"><h2 id="h-lt" class="split">What a late return costs</h2><p>Tap how many months late. The fine is charged for every month or part month, and doubles after the first year.</p></div>
    <div class="lt-g">
      <div>
        <div class="lt-top">
          <div class="lt-amt" aria-live="polite"><small>AED</small><span id="ltAmt">1,500</span></div>
          <p class="lt-mo" id="ltMo"><b>3 months</b> late, return penalty only</p>
        </div>
        <div class="cal" id="cal" role="group" aria-label="Months late"></div>
        <div class="cal-yr"><span>First year: AED 500 a month</span><span>Second year: AED 1,000 a month</span></div>
      </div>
      <div>
        <ul class="lt-list">
          <li><span><b>No Corporate Tax number by your date</b><small>One-off penalty</small></span><em>AED 10,000</em></li>
          <li><span><b>Late return, months 1 to 12</b><small>For each month or part month</small></span><em>AED 500</em></li>
          <li><span><b>Late return, from month 13</b><small>For each month or part month</small></span><em>AED 1,000</em></li>
          <li><span><b>Late payment</b><small>On the unpaid tax</small></span><em>14% a year</em></li>
        </ul>
        <p class="lt-p">Penalties are set by the FTA. Filing and paying on your date avoids all of them.</p>
      </div>
    </div>
  </div>
</section>

<!-- YEAR -->
<section class="yr" id="year" aria-labelledby="h-yr"><div class="yr-pin" id="yrPin"><div class="yr-sticky">
  <div class="wrap yr-head"><h2 id="h-yr" class="split">Your tax year with us</h2><p>These dates follow the year end on your dial. Change it at the top and they move with it.</p></div>
  <div class="yr-rail" id="yrRail"><article class="yc"><span class="yc-n">01</span><span class="when" id="w1">Before your first return</span><h3>Corporate Tax number</h3><p>We check yours is in place, or get it done with the FTA, so the AED 10,000 penalty never applies.</p></article><article class="yc"><span class="yc-n">02</span><span class="when" id="w2">Jan to Dec 2026</span><h3>Books kept every month</h3><p>Bookkeeping and reconciliations as you go, so year end is a review rather than a rush.</p></article><article class="yc"><span class="yc-n">03</span><span class="when" id="w3">Before 31 Dec 2026</span><h3>Relief and free zone check</h3><p>Small Business Relief, free zone income and exemptions, checked while there is still time to plan.</p></article><article class="yc"><span class="yc-n">04</span><span class="when" id="w4">Jan to Jul 2027</span><h3>Return prepared</h3><p>Your accounts turned into a complete return, with every adjustment explained to you.</p></article><article class="yc"><span class="yc-n">05</span><span class="when" id="w5">By 30 Sep 2027</span><h3>Filed and paid</h3><p>Filed with the FTA, with a payment reminder before your date.</p></article></div>
  <div class="wrap"><div class="yr-prog"><i id="yrFill"></i></div></div>
</div></div></section>

<section class="big" aria-label="Corporate Tax in numbers"><div class="wrap"><div class="big-g"><div class="bg-i"><b><span class="cnt" data-to="375">0</span><small>K</small></b><span>AED of taxable profit taxed at 0% each year</span></div><div class="bg-i"><b><span class="cnt" data-to="9">0</span><small>%</small></b><span>on taxable profit above AED 375,000</span></div><div class="bg-i"><b><span class="cnt" data-to="9">0</span><small>months</small></b><span>after your year end to file the return and pay</span></div><div class="bg-i"><b><span class="cnt" data-to="10000">0</span><small>AED</small></b><span>penalty for no Corporate Tax number by your date</span></div></div></div></section>

<!-- TRUST -->
<section class="sec trust" id="trust" aria-labelledby="h-tr"><div class="wrap">
<div class="sec-h"><h2 id="h-tr" class="split">Why businesses file with us</h2><p>A private consultancy in Business Bay, working with UAE businesses on Corporate Tax, VAT and their books.</p></div>
<div class="tr-rate" id="trRate" aria-label="Client rating"></div>
<div class="tr-g"><div class="tc"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg></i><h3>An office you can visit</h3><p>Meet our tax team in Business Bay, Dubai, or talk by call or WhatsApp.</p></div><div class="tc"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h3M8 17h6"/></svg></i><h3>Tax, VAT and books in one team</h3><p>Corporate Tax returns, VAT and bookkeeping handled together, so nothing falls between two firms.</p></div><div class="tc"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg></i><h3>Fees in writing first</h3><p>You get a written fee breakdown after your free review, before any work begins.</p></div><div class="tc"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-4-7.5L21 3v6h-6"/><path d="M12 8v4l3 2"/></svg></i><h3>Reminders before your date</h3><p>We track your tax period and remind you before the return and payment are due.</p></div></div>
<div class="revs" id="revs"></div>
</div></section>

<!-- FAQ -->
<section class="sec" id="faq" aria-labelledby="h-fq" style="padding-top:40px">
  <div class="wrap fq-g">
    <div class="fq-side">
      <h2 id="h-fq" class="split">Questions we hear most</h2>
      <p>Something else on your mind? Message our tax team on WhatsApp.</p>
      <a class="btn btn-line" href="https://wa.me/97145531546?text=Hello%2C%20I%20have%20a%20question%20about%20UAE%20Corporate%20Tax." target="_blank" rel="noopener" data-area="FAQ">Ask on WhatsApp</a>
    </div>
    <div id="faqList">__FAQ__</div>
  </div>
</section>

<!-- BOOK -->
<section class="sec book" id="book" aria-labelledby="h-bk">
  <div class="wrap bk-g">
    <div class="bk-side">
      <h2 id="h-bk" class="split">Book your free tax review</h2>
      <p>A few short questions. A member of our tax team will then call you to go through your dates, relief and records.</p>
      <ul class="bk-con">
        <li><a href="https://wa.me/97145531546?text=Hello%2C%20I%20would%20like%20a%20Corporate%20Tax%20review." target="_blank" rel="noopener" data-area="Book"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>WhatsApp us<small>Message any time</small></a></li>
        <li><a href="tel:+971522330011" data-area="Book"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>+971 52 233 0011<small>Call our team</small></a></li>
        <li><a href="mailto:connect@best-solution.ae" data-area="Book"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>connect@best-solution.ae<small>Email us</small></a></li>
      </ul>
      <p class="fee"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>Fees depend on your business size and the state of your books. You get them in writing before any work begins.</p>
      <figure class="bk-trust" id="bkTrust"></figure>
    </div>

    <div class="fm" id="fm" data-area="Tax Review Form"><canvas class="confetti" id="conf"></canvas>
      <div class="fm-top"><div class="fm-bar" aria-hidden="true"></div><span class="fm-step-n" id="fmN">Step 1 of 5</span></div>
      <form id="form" novalidate data-track="LP Corporate Tax Review">
        <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="fm-sum" id="fmSum"></div>
        <div class="steps">
          <fieldset class="step cur" data-s="1">
            <legend class="st-h">What kind of business is it?</legend>
            <div class="ch" id="chBiz">
              <label><input type="radio" name="biz" value="Mainland company"><span>Mainland company</span></label>
              <label><input type="radio" name="biz" value="Free zone company"><span>Free zone company</span></label>
              <label><input type="radio" name="biz" value="Freelancer or sole trader"><span>Freelancer or sole trader</span></label>
              <label><input type="radio" name="biz" value="Holding company"><span>Holding company</span></label>
              <label><input type="radio" name="biz" value="Not sure"><span>Not sure yet</span></label>
            </div>
          </fieldset>
          <fieldset class="step" data-s="2">
            <legend class="st-h">When does your financial year end?</legend>
            <div class="ch mgrid" id="chMo"></div>
            <div class="ch ygrid" id="chYr"></div>
          </fieldset>
          <fieldset class="step" data-s="3">
            <legend class="st-h">Roughly what is your annual revenue?</legend>
            <div class="ch" id="chRev">
              <label><input type="radio" name="revenue" value="Up to AED 1 million"><span>Up to AED 1 million</span></label>
              <label><input type="radio" name="revenue" value="AED 1M to 3M"><span>AED 1M to 3M</span></label>
              <label><input type="radio" name="revenue" value="AED 3M to 50M"><span>AED 3M to 50M</span></label>
              <label><input type="radio" name="revenue" value="Above AED 50M"><span>Above AED 50M</span></label>
              <label><input type="radio" name="revenue" value="Prefer not to say"><span>Prefer not to say</span></label>
            </div>
          </fieldset>
          <fieldset class="step" data-s="4">
            <legend class="st-h">What do you need help with?</legend>
            <div class="ch" id="chHelp">
              <label><input type="radio" name="help" value="Corporate Tax registration"><span>Corporate Tax registration</span></label>
              <label><input type="radio" name="help" value="Preparing and filing my return"><span>Preparing and filing my return</span></label>
              <label><input type="radio" name="help" value="Checking reliefs and exemptions"><span>Checking reliefs and exemptions</span></label>
              <label><input type="radio" name="help" value="Free zone 0% review"><span>Free zone 0% review</span></label>
              <label><input type="radio" name="help" value="Not sure yet"><span>Not sure yet</span></label>
            </div>
          </fieldset>
          <fieldset class="step" data-s="5">
            <legend class="st-h">Where should we reach you?</legend>
            <div class="fl"><input id="fName" name="name" placeholder=" " autocomplete="name"><label for="fName">Full name</label><span class="err">Please enter your name</span></div>
            <div class="fl"><div class="tel"><select id="fCC" aria-label="Country code"></select><div style="position:relative"><input id="fPhone" name="phone" type="tel" inputmode="tel" placeholder=" " autocomplete="tel-national"><label for="fPhone">Phone or WhatsApp</label></div></div><span class="err">Please enter a valid phone number</span></div>
            <div class="fl"><input id="fEmail" name="email" type="email" inputmode="email" placeholder=" " autocomplete="email"><label for="fEmail">Email</label><span class="err">Please enter a valid email</span></div>
          </fieldset>
        </div>
        <div class="fm-nav">
          <button type="button" class="back" id="fmBack" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>Back</button>
          <button type="submit" class="btn btn-cu" id="fmNext">Next</button>
        </div>
        <p class="fm-err" id="fmErr" role="alert" hidden>We could not send your details. Please try again, or message us on WhatsApp.</p>
        <p class="fm-priv">Private and confidential. By sending, you agree that Best Solution may contact you by phone, WhatsApp or email.</p>
      </form>
      <div class="done-v" role="status">
        <div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h3 id="doneH">Thank you.</h3>
        <p>A member of our tax team will contact you to arrange your free review. If you'd like to talk sooner, message us on WhatsApp.</p>
        <a class="btn btn-line" href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Success">Message us on WhatsApp</a>
      </div>
    </div>
  </div>
</section>

<dialog class="ux" id="ux" aria-labelledby="uxH">
  <form id="uxForm" novalidate data-track="LP Corporate Tax Estimate">
    <button type="button" class="ux-x" id="uxX" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <span class="ux-i" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>
    <p class="ux-k">Your Corporate Tax estimate</p>
    <h3 id="uxH">See your tax in seconds</h3>
    <p class="ux-p">Tell us where to reach you and your estimate opens straight away. It is an approximate figure: a tax advisor can then work out your exact tax with you, free.</p>
    <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="fl"><input id="uxName" name="name" placeholder=" " autocomplete="name"><label for="uxName">Full name</label><span class="err">Please enter your name</span></div>
    <div class="fl"><div class="tel"><select id="uxCC" aria-label="Country code"></select><div style="position:relative"><input id="uxPhone" name="phone" type="tel" inputmode="tel" placeholder=" " autocomplete="tel-national"><label for="uxPhone">Phone or WhatsApp</label></div></div><span class="err">Please enter a valid phone number</span></div>
    <div class="fl"><input id="uxEmail" name="email" type="email" inputmode="email" placeholder=" " autocomplete="email"><label for="uxEmail">Email</label><span class="err">Please enter a valid email</span></div>
    <p class="fm-err" id="uxErr" role="alert" hidden></p>
    <button type="submit" class="btn btn-cu ux-go" id="uxGo">Show my tax estimate</button>
    <p class="fm-priv">Private and confidential. By sending, you agree that Best Solution may contact you by phone, WhatsApp or email.</p>
  </form>
</dialog>
<dialog class="ux rv" id="rv" aria-label="Book your free tax review">
  <button type="button" class="ux-x rv-x" id="rvX" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <p class="rv-k" id="rvK">Free Corporate Tax review</p>
  <div id="rvSlot"></div>
</dialog>
</main>

<footer class="ft">
  <div class="wrap">
    <div class="ft-mark" id="ftMark" aria-hidden="true">Corporate Tax,<br>handled.</div>
    <div class="ft-top">
      <div><img src="/brand/logo-light.webp" alt="Best Solution" width="104" height="46"><p>Corporate Tax returns, bookkeeping and tax reviews for UAE businesses, from our office in Business Bay, Dubai.</p></div>
      <div><h4>On this page</h4><a href="#top">Due date</a><a href="#estimate">Estimate your tax</a><a href="#apply">Does it apply</a><a href="#late">Penalties</a></div>
      <div><h4>Contact</h4><a href="tel:+971522330011" data-area="Footer">+971 52 233 0011</a><a href="https://wa.me/97145531546" target="_blank" rel="noopener" data-area="Footer">WhatsApp</a><a href="mailto:connect@best-solution.ae" data-area="Footer">connect@best-solution.ae</a></div>
    </div>
    <p class="ft-legal">Best Solution® is a private business consultancy based in Business Bay, Dubai. We are not affiliated with the Federal Tax Authority or any government entity. Tax decisions, assessments and penalties are made solely by the relevant UAE authorities. Information on this page is general, reflects the rules as we understand them at the time of writing, is not tax or legal advice and does not replace advice on your own circumstances. The dial and estimator are illustrations only. Fees are confirmed in writing after your review.</p>
    <div class="ft-bot"><span>© 2026 Best Solution®. All rights reserved.</span><a href="https://best-solution.ae/privacy-policy">Privacy policy</a></div>
  </div>
</footer>

<div class="dock" id="dock">
  <a class="btn wa" href="https://wa.me/97145531546?text=Hello%2C%20I%20would%20like%20advice%20on%20UAE%20Corporate%20Tax." target="_blank" rel="noopener" data-area="Mobile Dock"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>WhatsApp</a>
  <a class="btn btn-ink" href="#book" data-cta-location="CT Dock Book">Book free review</a>
</div>`;
