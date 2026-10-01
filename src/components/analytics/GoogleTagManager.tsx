"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

/*
  Google Tag Manager via the Stape first-party Custom Loader, copied verbatim from best-solution.ae
  (webbs445/bestsolution GoogleTagManager.tsx). Do NOT refactor or "tidy" the minified body: it holds
  hand-tuned Safari ITP logic and the encoded container config, and paraphrasing it breaks first-party
  tracking on Safari. Loads from load.marktmen.best-solution.ae (fallback marktmen.best-solution.ae)
  for web container GTM-MLFW9XR. All values are public; they are served to every visitor.

  Unlike the main site, the container mounts as soon as the page hydrates instead of waiting for the
  first interaction: on a paid landing page every ad click should be measured, including visitors who
  leave without touching the page. Consent Mode defaults are already set by <ConsentInit>.
*/

const STAPE_LOADER = `!function(){"use strict";function l(e){for(var t=e,r=0,n=document.cookie.split(";");r<n.length;r++){var o=n[r].split("=");if(o[0].trim()===t)return o[1]}}function s(e){return localStorage.getItem(e)}function u(e){return window[e]}function A(e,t){e=document.querySelector(e);return t?null==e?void 0:e.getAttribute(t):null==e?void 0:e.textContent}var e=window,t=document,r="script",n="dataLayer",o="https://marktmen.best-solution.ae",a="https://load.marktmen.best-solution.ae",i="9aedwjpcazhlj",c="7=AwhVPTUuXScmKj9DOTFWHFdeRktHBx5XCAkbDkwQHwYfGAEVD00RDw%3D%3D",g="stapeUserId",v="",E="",d=!1;try{var d=!!g&&(m=navigator.userAgent,!!(m=new RegExp("Version/([0-9._]+)(.Mobile)?.*Safari.").exec(m)))&&16.4<=parseFloat(m[1]),f="stapeUserId"===g,I=d&&!f?function(e,t,r){void 0===t&&(t="");var n={cookie:l,localStorage:s,jsVariable:u,cssSelector:A},t=Array.isArray(t)?t:[t];if(e&&n[e])for(var o=n[e],a=0,i=t;a<i.length;a++){var c=i[a],c=r?o(c,r):o(c);if(c)return c}else console.warn("invalid uid source",e)}(g,v,E):void 0;d=d&&(!!I||f)}catch(e){console.error(e)}var m=e,g=(m[n]=m[n]||[],m[n].push({"gtm.start":(new Date).getTime(),event:"gtm.js"}),t.getElementsByTagName(r)[0]),v=I?"&bi="+encodeURIComponent(I):"",E=t.createElement(r),f=(d&&(i=8<i.length?i.replace(/([a-z]{8}$)/,"kp$1"):"kp"+i),!d&&a?a:o);E.async=!0,E.src=f+"/"+i+".js?"+c+v,null!=(e=g.parentNode)&&e.insertBefore(E,g)}();`

/** GTM must only run on the real site, so previews and localhost don't pollute GA4/Ads. */
function gtmAllowed(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_GTM === "true") return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "best-solution.ae" || host.endsWith(".best-solution.ae");
}

const noSubscribe = () => () => {};

export function GoogleTagManager() {
  // The hostname is only known in the browser: false while server-rendering, the real gate once hydrated.
  const allowed = useSyncExternalStore(noSubscribe, gtmAllowed, () => false);

  if (!allowed) return null;
  return <Script id="gtm-stape-loader" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: STAPE_LOADER }} />;
}

/** GTM <noscript> fallback for visitors with JavaScript disabled. Mount as the first child of <body>. */
export function GtmNoScript() {
  // Server-rendered, so no hostname: gate on the Vercel environment instead, as the main site does.
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") return null;
  return (
    <noscript>
      <iframe
        src="https://load.marktmen.best-solution.ae/ns.html?id=GTM-MLFW9XR"
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
