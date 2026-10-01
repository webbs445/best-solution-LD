/*
  Google Consent Mode v2 bootstrap, copied from best-solution.ae so both sites start from the same
  denied baseline. Rendered as a plain inline script in <head>, so it runs during HTML parsing, before
  any app code; the GTM loader mounts after hydration. Order: default(denied) -> restore saved
  choice -> GTM loads.

  The cookie name, shape and version MUST stay in sync with src/lib/consent.ts (CONSENT_COOKIE =
  "bs_consent", CONSENT_VERSION = 1). Inlined as a string because it must run before any module
  loads.
*/
const INLINE = `
(function(){
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  try {
    var m = document.cookie.match(/(?:^|; )bs_consent=([^;]*)/);
    if (m) {
      var c = JSON.parse(decodeURIComponent(m[1]));
      if (c && c.v === 1) {
        var g = function(v){ return v ? 'granted' : 'denied'; };
        gtag('consent', 'update', {
          ad_storage: g(c.marketing),
          ad_user_data: g(c.marketing),
          ad_personalization: g(c.marketing),
          analytics_storage: g(c.analytics),
          functionality_storage: g(c.functional),
          personalization_storage: g(c.functional),
          security_storage: 'granted'
        });
      }
    }
  } catch (e) {}
})();
`.trim();

export function ConsentInit() {
  return <script id="consent-init" dangerouslySetInnerHTML={{ __html: INLINE }} />;
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
