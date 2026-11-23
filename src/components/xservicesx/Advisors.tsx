"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NO_PREF, OFFICE_LINE } from "@/content/xservicesx";
import { XS_CONFIG as C, type Advisor } from "@/content/xservicesx.config";
import { xsTrack } from "./store";
import { Icon, MapArt, Silhouette } from "./ui";
import { XsCta } from "./XsCta";

/*
  Section 6. Desktop: the advisor photo panels (the open one grows; hover, focus or click opens one), the "Visit us" map
  card and the "No preference?" bar. Phone and tablet: a swipe carousel with dots, the bar, then a compact map card.
  With no advisors in XS_CONFIG the panels and carousel are left out; the map card and the bar stay.
*/
function Photo({ a, sizes }: { a: Advisor; sizes: string }) {
  return a.photo ? <Image className="xs-adv-photo" src={a.photo} alt={`${a.name}, ${a.role}`} fill sizes={sizes} /> : <Silhouette className="xs-adv-sil" />;
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
