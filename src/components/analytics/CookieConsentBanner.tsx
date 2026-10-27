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
      <div className={styles.card} role="region" aria-labelledby="consent-title">
        <h2 id="consent-title">Your privacy choice</h2>
        <p className={styles.text}>
          We use cookies to measure visits and improve the site.{" "}
          <a href={SITE.privacy} target="_blank" rel="noopener">
            Privacy Policy
          </a>
          {!showPrefs && (
            <>
              {" · "}
              <button type="button" className={styles.manage} aria-expanded={false} onClick={() => setShowPrefs(true)}>
                Manage preferences
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
