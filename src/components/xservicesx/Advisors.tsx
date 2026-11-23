"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NO_PREF, OFFICE_LINE } from "@/content/xservicesx";
import { XS_CONFIG as C, type Advisor } from "@/content/xservicesx.config";
import { xsTrack } from "./store";
import { Icon, Silhouette } from "./ui";
import { XsCta } from "./XsCta";

/*
  Section 6. Desktop: the advisor photo panels (the open one grows; hover, focus or click opens one), the "Visit us" map
  card and the "No preference?" bar. Phone and tablet: a swipe carousel with dots, the bar, then a compact map card.
  With no advisors in XS_CONFIG the panels and carousel are left out; the map card and the bar stay.
*/
function Photo({ a, sizes }: { a: Advisor; sizes: string }) {
  return a.photo ? <Image className="xs-adv-photo" src={a.photo} alt={`${a.name}, ${a.role}`} fill sizes={sizes} /> : <Silhouette className="xs-adv-sil" />;
}

function MapArt({ compact }: { compact?: boolean }) {
  return compact ? (
    <svg width="110" height="140" viewBox="0 0 110 140" aria-hidden="true">
      <path d="M-5 100 C 30 86, 60 112, 115 90" stroke="#CFE0EC" strokeWidth="14" fill="none" />
      <path d="M0 40 H110 M0 70 H110 M36 0 V140 M80 0 V140" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M55 64s10-11 10-19a10 10 0 0 0-20 0c0 8 10 19 10 19z" fill="#B9714B" />
      <circle cx="55" cy="45" r="4" fill="#FFFFFF" />
    </svg>
  ) : (
    <svg viewBox="0 0 280 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-10 196 C 60 170, 110 214, 170 184 S 260 150, 300 170" stroke="#CFE0EC" strokeWidth="22" fill="none" />
      <path d="M0 70 H280 M0 128 H280 M0 240 H280 M58 0 V270 M150 0 V270 M226 0 V270" stroke="#FFFFFF" strokeWidth="9" />
      <path d="M0 30 L280 110" stroke="#FFFFFF" strokeWidth="14" />
      <rect x="72" y="84" width="62" height="30" rx="5" fill="#E6DCD1" />
      <rect x="164" y="138" width="48" height="36" rx="5" fill="#E6DCD1" />
      <rect x="72" y="138" width="62" height="34" rx="5" fill="#E6DCD1" />
      <rect x="164" y="80" width="48" height="34" rx="5" fill="#E6DCD1" />
      <path d="M140 116s10-11 10-19a10 10 0 0 0-20 0c0 8 10 19 10 19z" fill="#B9714B" />
      <circle cx="140" cy="97" r="4" fill="#FFFFFF" />
    </svg>
  );
}

function MapCard({ compact }: { compact?: boolean }) {
  return (
    <div className={`xs-map${compact ? " is-compact" : ""}`}>
      <div className="xs-map-art">
        <MapArt compact={compact} />
        {!compact && <span className="xs-pulse" aria-hidden="true" />}
      </div>
      <div className="xs-map-body">
        <span className="xs-eyebrow">VISIT US</span>
        <b>{compact ? OFFICE_LINE.replace(", Dubai", "") : OFFICE_LINE}</b>
        {C.officeHours && <span className="xs-map-hours">{C.officeHours}</span>}
        <a className={compact ? "xs-map-dir" : "xs-link"} href={C.mapsUrl} target="_blank" rel="noopener noreferrer">
          Get directions <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

export function Advisors() {
  const list = C.advisors;
  const [open, setOpen] = useState(0);
  const [slide, setSlide] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());

  const view = (i: number) => {
    setOpen(i);
    const id = list[i]?.id;
    if (id && !seen.current.has(id)) {
      seen.current.add(id);
      xsTrack("xs_advisor_view", { advisor: id });
    }
  };

  // Carousel dots follow the scroll position.
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (card) setSlide(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const noPref = (
    <div className="xs-nopref">
      <span className="xs-nopref-ico d-only" aria-hidden="true">
        <Icon name="phone" size={20} />
      </span>
      <p>
        <strong>No preference?</strong> {NO_PREF}
      </p>
      <XsCta id="s6_any" location="s6" variant="dark" set={{ advisor: "any" }}>
        First available advisor
      </XsCta>
    </div>
  );

  return (
    <section className="xs-sec xs-s6" id="advisors" aria-labelledby="xsS6">
      <div className="xs-wrap">
        <div className="xs-s6-head">
          <div>
            <span className="xs-eyebrow">WHO YOU&apos;LL TALK TO</span>
            <h2 id="xsS6">Real people. Not a call centre.</h2>
            {list.length > 0 && (
              <p>
                <span className="d-only">Meet the advisors behind your plan. Pick one, or let the first available advisor call you.</span>
                <span className="m-only">Swipe to meet the advisors behind your plan.</span>
              </p>
            )}
          </div>
          {list.length > 0 && (
            <span className="xs-s6-hint d-only">
              <Icon name="hand" size={16} />
              Hover a photo to meet them
            </span>
          )}
        </div>

        <div className={`xs-panels-row${list.length ? "" : " no-adv"}`}>
          {list.length > 0 && (
            <div className="xs-panels d-only">
              {list.map((a, i) => {
                const on = i === open;
                return (
                  <div key={a.id} className={`xs-panel${on ? " is-open" : ""}`} onMouseEnter={() => view(i)}>
                    <Photo a={a} sizes="(min-width: 1024px) 520px, 1px" />
                    <span className="xs-panel-shade" aria-hidden="true" />
                    <button type="button" className="xs-panel-btn" aria-expanded={on} aria-controls={`xs-adv-${a.id}`} onClick={() => view(i)} onFocus={() => view(i)}>
                      <span className="xs-panel-short">
                        <b>{a.name}</b>
                        <span>{a.focusLabel}</span>
                      </span>
                      <span className="xs-panel-plus" aria-hidden="true">
                        <Icon name="plus" size={16} strokeWidth={2.4} />
                      </span>
                    </button>
                    <div className="xs-panel-detail" id={`xs-adv-${a.id}`} inert={!on}>
                      <span className="xs-eyebrow xs-on-navy">YOU&apos;LL TALK TO</span>
                      <span className="xs-panel-name">
                        <b>{a.name}</b>
                        <span>{a.role}</span>
                      </span>
                      <p>&ldquo;{a.quote}&rdquo;</p>
                      <span className="xs-topics">
                        {a.topics.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </span>
                      <span className="xs-panel-lang">{a.languages} · Video or in person</span>
                      <XsCta id={`s6_${a.id}`} location="s6" set={{ advisor: a.id }}>
                        Talk to {a.name}
                      </XsCta>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="d-only xs-map-col">
            <MapCard />
          </div>
        </div>

        {list.length > 0 && (
          <div className="m-only">
            <div className="xs-rail" ref={rail}>
              {list.map((a) => (
                <div key={a.id} className="xs-acard">
                  <Photo a={a} sizes="300px" />
                  <span className="xs-panel-shade" aria-hidden="true" />
                  <div className="xs-acard-body">
                    <b>{a.name}</b>
                    <span className="xs-acard-role">
                      {a.role} · {a.languages}
                    </span>
                    <p>&ldquo;{a.quote}&rdquo;</p>
                    <span className="xs-topics">
                      {a.topics.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </span>
                    <XsCta id={`s6_${a.id}`} location="s6" set={{ advisor: a.id }}>
                      Talk to {a.name}
                    </XsCta>
                  </div>
                </div>
              ))}
            </div>
            <div className="xs-dots" aria-hidden="true">
              {list.map((a, i) => (
                <span key={a.id} className={i === slide ? "on" : undefined} />
              ))}
            </div>
          </div>
        )}

        {noPref}
        <div className="m-only">
          <MapCard compact />
        </div>
      </div>
    </section>
  );
}
