"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AC_CLAIMS, AC_REVIEWS } from "@/content/accounting";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { AcTeam } from "./AcTeam";

const WHY: { title: string; body: string; icon: ReactNode }[] = [
  { title: `${AC_CLAIMS.ownership}, since ${AC_CLAIMS.founded}`, body: "A Business Bay firm advising UAE companies for more than a decade.", icon: <path d="M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z" /> },
  {
    title: "One point of contact",
    body: "One person for your books, reachable by phone, email or WhatsApp.",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </>
    ),
  },
  {
    title: "In-house team",
    body: `${AC_CLAIMS.professionals}+ professionals in one office, with ${AC_CLAIMS.accountingSpecialists}+ dedicated to accounting.`,
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M16 4.5a3 3 0 0 1 0 6M21 20c0-2.6-1.6-4.8-4-5.6" />
      </>
    ),
  },
  {
    title: "Your software, or ours",
    body: "Zoho Books, QuickBooks, Tally or spreadsheets.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 18v3" />
      </>
    ),
  },
  {
    title: "Remote or in person",
    body: "Meet at our office or work entirely over video and WhatsApp.",
    icon: (
      <>
        <path d="M15 10l5-5M20 5v5M20 5h-5" />
        <path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
      </>
    ),
  },
  {
    title: "Confidential by default",
    body: "Handled by your assigned accounting team and kept confidential.",
    icon: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
];

const GOOGLE_G = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.9l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
  </svg>
);

/* Review slider: auto-advances every 6 seconds (not with reduced motion); arrows, dots and swipe. */
function Reviews() {
  const [i, setI] = useState(0);
  const timer = useRef(0);
  const touchX = useRef<number | null>(null);
  const n = AC_REVIEWS.length;

  const restart = useCallback(() => {
    window.clearInterval(timer.current);
    if (!prefersReducedMotion()) timer.current = window.setInterval(() => setI((x) => (x + 1) % n), 6000);
  }, [n]);

  useEffect(() => {
    restart();
    return () => window.clearInterval(timer.current);
  }, [restart]);

  const go = (to: number) => {
    setI((to + n) % n);
    restart();
  };

  return (
    <div
      className="slider"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="slides">
        {AC_REVIEWS.map((r, k) => (
          <figure key={r.name} className={`slide${k === i ? " on" : ""}`} aria-hidden={k !== i}>
            <q>{r.quote}</q>
            <figcaption className="by">
              <Image className="av" src={`/testimonials/${r.photo}.webp`} alt="" width={48} height={48} />
              <div>
                <b>{r.name}</b>
                <span>
                  {r.role}, {r.company}
                </span>
                <em>Best Solution client</em>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="s-ctrl">
        <div className="dots">
          {AC_REVIEWS.map((r, k) => (
            <button key={r.name} type="button" aria-label={`Review ${k + 1}`} aria-current={k === i} onClick={() => go(k)} />
          ))}
        </div>
        <div className="arrows">
          <button type="button" aria-label="Previous review" onClick={() => go(i - 1)}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 10H4M9 5l-5 5 5 5" />
            </svg>
          </button>
          <button type="button" aria-label="Next review" onClick={() => go(i + 1)}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AcWhy() {
  return (
    <section className="sheet s-ground light-zone" id="why">
      <div className="wrap">
        <div className="head center rv">
          <span className="kicker">Why Best Solution</span>
          <h2>One team that knows your business.</h2>
          <p className="lede">
            Your accountants sit in the same office as the advisors who know your company structure, so questions get
            answered without being passed around.
          </p>
        </div>
        <div className="why">
          {WHY.map((w, k) => (
            <div key={w.title} className={`w spotlight rv${k % 3 ? ` d${k % 3}` : ""}`}>
              <i>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {w.icon}
                </svg>
              </i>
              <b>{w.title}</b>
              <p>{w.body}</p>
            </div>
          ))}
        </div>

        <AcTeam />

        <div className="rev rv">
          <div className="score">
            <div className="st">★★★★★</div>
            <div>
              <b>{AC_CLAIMS.rating}</b>
              {/* The Google logo and profile link appear once AC_CLAIMS.googleProfileUrl is set. */}
              {AC_CLAIMS.googleProfileUrl ? (
                <a className="g-link" href={AC_CLAIMS.googleProfileUrl} target="_blank" rel="noopener">
                  {GOOGLE_G}
                  Average from {AC_CLAIMS.reviewCount}+ Google reviews
                </a>
              ) : (
                <small>Average from {AC_CLAIMS.reviewCount}+ Google reviews</small>
              )}
            </div>
          </div>
          <Reviews />
        </div>
      </div>
    </section>
  );
}
