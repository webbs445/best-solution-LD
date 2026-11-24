"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { SITE } from "@/content/site";
import { setVisitorGeo, type VisitorGeo } from "@/lib/analytics";
import { ALL_DENIED, ALL_GRANTED, readConsent, setConsent, type ConsentChoices } from "@/lib/consent";
import styles from "./CookieConsentBanner.module.css";

/*
  The cookie banner on every page. Consent Mode v2: ConsentInit sets every signal to denied before GTM loads, so tags
  run with consent denied (Google tags may send cookieless pings; Clarity is held back) until the visitor chooses here.
  Phones: a slim bottom sheet (the /xservicesx sticky bar moves up above it). From 768 px: a compact card, bottom left,
  at most 400 px wide. It appears about 1 s after the page paints. Reject and Accept: same size, same row, always shown;
  "Choose what to allow" opens the two categories, both off until the visitor turns one on.
*/
const CATEGORIES: { key: keyof ConsentChoices; label: string; description: string }[] = [
  { key: "analytics", label: "Analytics", description: "Google Analytics and Microsoft Clarity: how visitors use the site, so we can improve it." },
  { key: "marketing", label: "Marketing", description: "Google Ads and Meta: measuring our ad campaigns and showing relevant offers." },
];

/** Dispatch this from anywhere (the footer "Cookie settings" link) to reopen the preferences. */
export const OPEN_COOKIE_PREFERENCES = "open-cookie-preferences";

/** Footer "Cookie Settings" control: reopens the banner with the preferences expanded. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES))}>
      Cookie Settings
    </button>
  );
}

const noSubscribe = () => () => {};

export function CookieConsentBanner() {
  // null until the visitor acts: the banner then shows only while no choice is saved. Reopen sets true, a choice false.
  const [open, setOpen] = useState<boolean | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(ALL_DENIED);
  // The cookie is only readable in the browser: "chosen" while server-rendering, so the banner appears after hydration.
  const chosen = useSyncExternalStore(noSubscribe, () => readConsent() !== null, () => true);
  // About 1 s after first paint, so the page shows first (no tag waits on this: the defaults are already denied).
  const [ready, setReady] = useState(false);
  const visible = open ?? (ready && !chosen);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1000);
    // The visitor's country goes to analytics (setVisitorGeo); the banner itself no longer depends on it.
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: VisitorGeo) => setVisitorGeo(data))
      .catch(() => {});

    const reopen = () => {
      setChoices(readConsent() ?? ALL_DENIED);
      setShowPrefs(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES, reopen);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(OPEN_COOKIE_PREFERENCES, reopen);
    };
  }, []);

  const commit = (next: ConsentChoices) => {
    setConsent(next);
    setOpen(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.card} role="region" aria-labelledby="consent-title">
        <h2 id="consent-title">Help us improve this page</h2>
        <p className={styles.text}>
          We use cookies to measure visits and see which ads bring founders here. Nothing is shared without your OK.{" "}
          {!showPrefs && (
            <>
              <button type="button" className={styles.manage} aria-expanded={false} onClick={() => setShowPrefs(true)}>
                Choose what to allow
              </button>
              {" · "}
            </>
          )}
          <a href={SITE.privacy} target="_blank" rel="noopener">
            Privacy Policy
          </a>
        </p>

        {showPrefs && (
          <div className={styles.prefs}>
            <div className={styles.row}>
              <div>
                <p>Necessary</p>
                <small>Keeps the site working and remembers this choice. Always on.</small>
              </div>
              <span className={styles.always}>Always on</span>
            </div>
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className={styles.row}>
                <div>
                  <p id={`consent-${cat.key}`}>{cat.label}</p>
                  <small>{cat.description}</small>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={choices[cat.key]}
                  aria-labelledby={`consent-${cat.key}`}
                  className={styles.switch}
                  onClick={() => setChoices((c) => ({ ...c, [cat.key]: !c[cat.key] }))}
                >
                  <span />
                </button>
              </div>
            ))}
            <button type="button" className={styles.save} onClick={() => commit(choices)}>
              Save preferences
            </button>
          </div>
        )}

        {/* Same size, same row, both always shown: Reject outlined, Accept filled, both navy. */}
        <div className={styles.choices}>
          <button type="button" className={`${styles.choice} ${styles.reject}`} onClick={() => commit(ALL_DENIED)}>
            Reject
          </button>
          <button type="button" className={`${styles.choice} ${styles.accept}`} onClick={() => commit(ALL_GRANTED)}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
