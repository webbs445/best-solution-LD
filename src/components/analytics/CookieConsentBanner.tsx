"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/content/site";
import { setVisitorGeo, type VisitorGeo } from "@/lib/analytics";
import { ALL_DENIED, ALL_GRANTED, readConsent, setConsent, type ConsentChoices } from "@/lib/consent";
import styles from "./CookieConsentBanner.module.css";

/* Behaviour and wording match the best-solution.ae banner so visitors see one consent experience. */
const CATEGORIES: { key: keyof ConsentChoices; label: string; description: string }[] = [
  { key: "analytics", label: "Analytics", description: "Helps us understand how visitors use the site so we can improve it." },
  { key: "marketing", label: "Marketing", description: "Used to measure ad campaigns and show you relevant offers." },
  { key: "functional", label: "Functional", description: "Remembers your preferences for a smoother experience." },
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
  // EU/EEA/UK/CH visitors get a real reject option; elsewhere the main site's accept-to-enter wall.
  const [isEU, setIsEU] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(ALL_DENIED);

  // Wait for geo before showing, so EU visitors never flash the wall and vice versa. Unknown geo => EU.
  useEffect(() => {
    const saved = readConsent();
    let cancelled = false;

    fetch("/api/geo", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { eu?: boolean } & VisitorGeo) => {
        if (cancelled) return;
        setVisitorGeo(data);
        setIsEU(!!data.eu);
        if (!saved) setVisible(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsEU(true);
        if (!saved) setVisible(true);
      });

    const reopen = () => {
      setChoices(readConsent() ?? ALL_DENIED);
      setShowPrefs(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES, reopen);
    return () => {
      cancelled = true;
      window.removeEventListener(OPEN_COOKIE_PREFERENCES, reopen);
    };
  }, []);

  const commit = (next: ConsentChoices) => {
    setConsent(next);
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  return (
    <>
      {!isEU && <div className={styles.backdrop} aria-hidden="true" />}
      <div className={styles.wrap} role="dialog" aria-modal={!isEU} aria-label="Cookie consent">
        <div className={styles.card}>
          <div className={styles.head}>
            <span className={styles.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" />
              </svg>
            </span>
            <div>
              <h2>We value your privacy</h2>
              <p>
                We use cookies to run essential features, analyse traffic, and improve your experience. See our{" "}
                <a href={SITE.privacy} target="_blank" rel="noopener">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

          {showPrefs && (
            <div className={styles.prefs}>
              <div className={styles.row}>
                <div>
                  <p>Strictly necessary</p>
                  <small>Required for the site to work. Always active.</small>
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
            </div>
          )}

          <div className={styles.actions}>
            {showPrefs ? (
              <button type="button" className={styles.secondary} onClick={() => commit(choices)}>
                Save preferences
              </button>
            ) : (
              <button type="button" className={styles.secondary} onClick={() => setShowPrefs(true)}>
                Preferences
              </button>
            )}
            {isEU && (
              <button type="button" className={styles.secondary} onClick={() => commit(ALL_DENIED)}>
                Reject all
              </button>
            )}
            <button type="button" className={styles.accept} onClick={() => commit(ALL_GRANTED)}>
              Accept all
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
