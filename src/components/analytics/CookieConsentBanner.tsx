"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { setVisitorGeo, type VisitorGeo } from "@/lib/analytics";
import { ALL_DENIED, ALL_GRANTED, readConsent, setConsent, type ConsentChoices } from "@/lib/consent";
import styles from "./CookieConsentBanner.module.css";

/*
  Consent Mode v2 Basic: nothing that measures or advertises runs before the visitor chooses (ConsentInit sets every
  signal to denied; GTM's tags wait for their consent). One bottom banner on every device and for every visitor:
  Reject all and Accept all side by side, equal in size and style, plus "Manage preferences" for the categories.
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

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(ALL_DENIED);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
    // The visitor's country goes to analytics (setVisitorGeo); the banner itself no longer depends on it.
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: VisitorGeo) => setVisitorGeo(data))
      .catch(() => {});

    const reopen = () => {
      setChoices(readConsent() ?? ALL_DENIED);
      setShowPrefs(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES, reopen);
  }, []);

  const commit = (next: ConsentChoices) => {
    setConsent(next);
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={`${styles.card}${showPrefs ? ` ${styles.open}` : ""}`} role="region" aria-labelledby="consent-title">
        <h2 id="consent-title">Your privacy choice</h2>
        {/* Phones show a slim pill: "We use cookies", a settings button and the two choices. The full sentence and the
            Privacy Policy link show on wider screens and once the settings are open. */}
        <p className={styles.text}>
          <span className={styles.long}>We use cookies to measure visits and improve the site. </span>
          <span className={styles.short}>We use cookies</span>
          <span className={styles.long}>
            <a href={SITE.privacy} target="_blank" rel="noopener">
              Privacy Policy
            </a>
          </span>
          {!showPrefs && (
            <>
              <span className={styles.long}>{" · "}</span>
              <button type="button" className={styles.manage} aria-label="Manage preferences" aria-expanded={false} onClick={() => setShowPrefs(true)}>
                <span className={styles.long}>Manage preferences</span>
                <svg className={styles.gear} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                </svg>
              </button>
            </>
          )}
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

        {/* Same class for both: equal size and style. */}
        <div className={styles.choices}>
          <button type="button" className={styles.choice} onClick={() => commit(ALL_DENIED)}>
            Reject all
          </button>
          <button type="button" className={styles.choice} onClick={() => commit(ALL_GRANTED)}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
