import { OPT_IN_COUNTRIES } from "@/lib/consentRegions";

/*
  Google Consent Mode v2 bootstrap. The first script in <head> (see the root layout), so it runs during HTML parsing,
  before any app code, before the page-context push and long before the GTM loader (mounted after hydration).
  Order: defaults (denied in the EEA, UK and Switzerland; granted everywhere else) -> restore a saved choice -> GTM.
  A saved "Reject all" therefore keeps a visitor denied on every later visit, wherever they are.

  The cookie name, shape and version MUST stay in sync with src/lib/consent.ts (CONSENT_COOKIE =
  "bs_consent", CONSENT_VERSION = 2). Inlined as a string because it must run before any module
  loads.
*/
// The region list as a JS array literal with single quotes, e.g. ['AT','BE',...].
const REGIONS = "[" + OPT_IN_COUNTRIES.map((c) => "'" + c + "'").join(",") + "]";

export const CONSENT_INIT_SCRIPT = `
(function(){
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;

  // EEA, UK and Switzerland: everything denied until the visitor chooses (a region default wins over the general one).
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    region: ${REGIONS},
    wait_for_update: 500
  });
  // Everywhere else: measurement and ads on until the visitor clicks Reject all.
  gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  // Microsoft Clarity comes from the GTM container and does not follow Google Consent Mode. Its own
  // consent API is queued here, before GTM loads it: denied = no _clck/_clsk cookies until consent is known. The
  // region is not known in this script, so outside the EEA, UK and Switzerland the banner grants Clarity once
  // /api/geo answers (lib/consent applyRegionDefault).
  // The GTM snippet reuses this window.clarity queue, so the signal is applied as soon as Clarity starts.
  window.clarity = window.clarity || function(){ (window.clarity.q = window.clarity.q || []).push(arguments); };
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });

  // Hold back the Clarity script itself until analytics consent: GTM's Clarity tag adds a <script> from
  // clarity.ms, and Microsoft sets its own cookies (MUID, CLID) as soon as it loads. Any such script is parked
  // here and only inserted once window.__bsReleaseClarity() runs (on a saved or new analytics "granted").
  // Belt and braces: the proper fix is a consent check on the Clarity tag in GTM.
  (function(){
    var held = [], proto = Node.prototype, ins = proto.insertBefore, app = proto.appendChild;
    // No regex: this script lives in a template string, which would strip any backslashes.
    var isClarity = function(n){
      if (window.__bsClarityOk || !n || n.tagName !== 'SCRIPT' || !n.src) return false;
      var host = ''; try { host = new URL(n.src).hostname; } catch (e) {}
      return host === 'clarity.ms' || host.slice(-11) === '.clarity.ms';
    };
    proto.insertBefore = function(n, ref){ if (isClarity(n)) { held.push([this, n, ref]); return n; } return ins.call(this, n, ref); };
    proto.appendChild = function(n){ if (isClarity(n)) { held.push([this, n, null]); return n; } return app.call(this, n); };
    window.__bsReleaseClarity = function(){
      window.__bsClarityOk = true;
      held.splice(0).forEach(function(h){
        if (h[2] && h[2].parentNode === h[0]) ins.call(h[0], h[1], h[2]); else app.call(h[0], h[1]);
      });
    };
  })();

  try {
    var m = document.cookie.match(/(?:^|; )bs_consent=([^;]*)/);
    if (m) {
      var c = JSON.parse(decodeURIComponent(m[1]));
      if (c && c.v === 2) {
        var g = function(v){ return v ? 'granted' : 'denied'; };
        gtag('consent', 'update', {
          ad_storage: g(c.marketing),
          ad_user_data: g(c.marketing),
          ad_personalization: g(c.marketing),
          analytics_storage: g(c.analytics),
          functionality_storage: 'denied',
          personalization_storage: 'denied',
          security_storage: 'granted'
        });
        window.clarity('consentv2', { ad_Storage: g(c.marketing), analytics_Storage: g(c.analytics) });
        if (c.analytics) window.__bsReleaseClarity();
      }
    }
  } catch (e) {}
})();
`.trim();

export function ConsentInit() {
  return <script id="consent-init" dangerouslySetInnerHTML={{ __html: CONSENT_INIT_SCRIPT }} />;
}

/*
  Seeds the page context into the dataLayer BEFORE GTM loads, with NO `event` key, so the keys are
  available to every tag and built-in trigger while no trigger can fire on the push. Same keys as the
  main site's PageContextInit; this page is English only.
*/
export function PageContextInit() {
  const context = JSON.stringify({ locale: "en", language: "en", dir: "ltr" });
  return (
    <script
      id="page-context-init"
      dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push(${context});` }}
    />
  );
}
