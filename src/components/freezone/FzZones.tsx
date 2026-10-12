"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  ACT_LABEL,
  ACTS,
  EM_SHORT,
  PK,
  POPULAR_ACTS,
  RATES,
  SECT,
  ZONES,
  ZONE_BY_ID,
  activityIcon,
  type Activity,
  type SectorKey,
  type Zone,
  type ZoneGroup,
} from "@/content/freezone";
import { cleanPlanner, findActs, maxPack, norm, plannerEstimate, renewalFor, zoneHaystack, zonesForSector } from "@/lib/freezone";
import { formatAED } from "@/lib/pricing";
import { FZ_FORM_ID } from "@/lib/lead";
import { trackEvent, trackJurisdictionInterest } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { LockedFigure, useEstimateUnlocked } from "@/components/ui/LockedFigure";
import { QuickCapture } from "@/components/ui/QuickCapture";
import { LOCK_ICON, UNLOCK_THANKS_MS, UnlockDialog } from "@/components/ui/UnlockDialog";
import { CallbackTrigger } from "./CallbackTrigger";
import { usePlanner } from "./PlannerProvider";
import { ZoneLogo } from "./ZoneLogo";
import s from "./FzZones.module.css";

/*
  "Explore all 28 free zones": search by activity, filter, compare up to three. Every price stays locked until
  the visitor sends their details once (the same popup as the planner); then all prices show.
  Laptop: the list beside a sticky detail panel. Phones: cards, and a tapped zone opens its details in place.
*/

type Group = "all" | ZoneGroup;
type Sort = "price" | "name";

/** Dispatch on window (a CustomEvent with this detail) to preset the explorer, e.g. from a sitelink route. */
export const FZ_ZONES_PRESET = "fz-zones-preset";
export interface ZonesPreset {
  group?: Group;
  sort?: Sort;
}

const FILTERS: { g: Group; label: string }[] = [
  { g: "all", label: "All zones" },
  { g: "value", label: "Cost-efficient" },
  { g: "dubai", label: "Dubai" },
  { g: "sector", label: "Specialist" },
  { g: "trade", label: "Trade" },
  { g: "finance", label: "Financial" },
];

/** Phones show this many zones before "Show all". */
const FIRST = 8;
const PHONE = "(max-width: 900px)";

/* Normalised like the query (norm), so "IFZA (Dubai)" finds "ifza dubai". */
const HAY = Object.fromEntries(ZONES.map((zn) => [zn.id, norm(zoneHaystack(zn))]));
const track = trackEvent;

function ActIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: activityIcon(name) }} />
    </span>
  );
}

/* Wrap the matched part of a suggestion in <mark>. */
function highlight(txt: string, needle: string): ReactNode {
  const lo = txt.toLowerCase();
  const nd = needle.toLowerCase();
  let i = -1;
  if (nd) {
    i = lo.indexOf(nd);
    const m = (" " + lo).indexOf(" " + nd);
    if (m >= 0) i = m;
    if (i > 0 && lo.charAt(i - 1) !== " " && nd.length < 3) i = -1;
  }
  if (i < 0) return txt;
  return (
    <>
      {txt.slice(0, i)}
      <mark>{txt.slice(i, i + needle.length)}</mark>
      {txt.slice(i + needle.length)}
    </>
  );
}

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const PLUS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ARROW = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ---------- One zone's details (laptop: the side panel; phones: under its card) ---------- */

function ZoneDetail({
  zone,
  act,
  unlocked,
  inCmp,
  onCompare,
  onCost,
}: {
  zone: Zone;
  act: Activity | null;
  unlocked: boolean;
  inCmp: boolean;
  onCompare: () => void;
  onCost: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pk = PK[zone.id];
  const mp = maxPack(zone);
  const base = zone.exact ? zone.exact["0"] : zone.price;
  const lock = (text: string) => <LockedFigure text={text} unlocked={unlocked} />;

  const facts: [string, ReactNode][] = [
    ["Residency", mp !== null ? `Package covers up to ${mp} people` : unlocked ? `AED ${formatAED(RATES.residencyPerPerson)} per person` : "Priced per person"],
    ["Year-two renewal", lock(`About AED ${formatAED(renewalFor(zone))}`)],
    ["Workspace", "Flexi-desk included"],
    ...(pk
      ? ([
          ["Activities", pk.actTxt],
          ["Shareholders", pk.shTxt],
        ] as [string, string][])
      : ([["Price basis", "Catalogue estimate"]] as [string, string][])),
    ...(act ? ([["Your activity", `${zone.sect.includes(act[1]) ? "Typically covered: " : "Not typically covered: "}${act[0]}`]] as [string, string][]) : []),
  ];

  // "Known for": the visitor's activity sector first (if covered), then the zone's own strengths.
  const lead: SectorKey[] = [];
  if (act && zone.sect.includes(act[1])) lead.push(act[1]);
  zone.t.forEach((t) => {
    if (!lead.includes(t) && zone.sect.includes(t)) lead.push(t);
  });
  const shownLead = lead.slice(0, 3);
  const rest = zone.sect.filter((t) => !shownLead.includes(t));
  const chip = (t: SectorKey) => (
    <li key={t} className={act && act[1] === t ? s.tagOn : undefined}>
      {SECT[t] || ACT_LABEL[t as keyof typeof ACT_LABEL] || t}
    </li>
  );

  return (
    <div className={s.detail}>
      <div className={s.dTop}>
        <ZoneLogo zone={zone} size="zl-xl" />
        <div>
          <span className={s.dEm}>{zone.emirate}</span>
          <h3>{zone.name}</h3>
        </div>
      </div>
      <p className={s.dDesc}>{zone.d}</p>

      <div className={s.dPrice}>
        <div>
          <small>First year from</small>
          <b>{lock(`AED ${formatAED(zone.price)}`)}</b>
        </div>
        {unlocked ? (
          <span className={s.dInc}>{CHECK} Flexi-desk included</span>
        ) : (
          <span className={s.dLock}>
            <i>{LOCK_ICON}</i> Locked
          </span>
        )}
      </div>

      <dl className={s.facts}>
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {pk?.years && (
        <div className={s.years}>
          <p className={s.sub}>Multi-year package, no residency</p>
          <ul>
            <li>
              <small>1 year</small>
              <b>{lock(`AED ${formatAED(base)}`)}</b>
            </li>
            {pk.years.map(([y, total]) => (
              <li key={y}>
                <small>{y} years</small>
                <b>{lock(`AED ${formatAED(total)}`)}</b>
                {/* A multi-year saving only when it is meaningful (2%+), not rounding-level differences. */}
                {unlocked && base * y - total >= base * y * 0.02 && <em>Save AED {formatAED(base * y - total)}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {pk?.note && <p className={s.dNote}>{pk.note}</p>}

      <p className={s.sub}>Known for</p>
      <ul className={s.tags}>
        {shownLead.map(chip)}
        {moreOpen && rest.map(chip)}
        {rest.length > 0 && (
          <li>
            <button type="button" className={s.more} aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)}>
              {moreOpen ? "Show less" : `+${rest.length} more`}
            </button>
          </li>
        )}
      </ul>

      <div className={s.dActions}>
        <button type="button" className={s.cta} onClick={onCost}>
          {unlocked ? null : <span className={s.ctaLock}>{LOCK_ICON}</span>}
          {unlocked ? "Plan this zone" : "Get my cost"} {ARROW}
        </button>
        <button type="button" className={s.cmpBtn} aria-pressed={inCmp} onClick={onCompare}>
          {inCmp ? CHECK : PLUS} {inCmp ? "In compare" : "Compare"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Side-by-side comparison (cards; swipe on phones) ---------- */

function CompareSheet({
  ids,
  unlocked,
  onClose,
  onCost,
  onRemove,
}: {
  ids: string[];
  unlocked: boolean;
  onClose: () => void;
  onCost: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const zs = ids.map((id) => ZONE_BY_ID[id]);
  const low = Math.min(...zs.map((zn) => zn.price));

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  const rows: [string, (zn: Zone) => ReactNode][] = [
    ["First year from", (zn) => <LockedFigure text={`AED ${formatAED(zn.price)}`} unlocked={unlocked} />],
    ["Year-two renewal", (zn) => <LockedFigure text={`About AED ${formatAED(renewalFor(zn))}`} unlocked={unlocked} />],
    ["Workspace", () => "Flexi-desk included"],
    ["Activities", (zn) => PK[zn.id]?.actTxt ?? "Confirmed by your advisor"],
    ["Shareholders", (zn) => PK[zn.id]?.shTxt ?? "Confirmed by your advisor"],
    [
      "Residency",
      (zn) => {
        const m = maxPack(zn);
        return m !== null ? `Package covers up to ${m} people` : "Priced per person";
      },
    ],
  ];

  return (
    <dialog ref={dialog} className={s.cmpDlg} aria-labelledby="cmpTitle" onClose={onClose} onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
      <div className={s.cmpCard}>
        <div className={s.cmpHead}>
          <div>
            <h3 id="cmpTitle">Compare free zones</h3>
            <p>{unlocked ? "Indicative rate-card prices. Your advisor confirms the final cost in writing." : "Prices unlock with one quick form."}</p>
          </div>
          <button type="button" className={s.close} aria-label="Close" onClick={() => dialog.current?.close()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className={s.cmpCols} style={{ "--n": zs.length } as CSSProperties}>
          {zs.map((zn) => (
            <article key={zn.id} className={s.cmpCol}>
              <div className={s.cmpZone}>
                <ZoneLogo zone={zn} size="zl-cmp" />
                <span>
                  <b>{zn.name}</b>
                  <small>{zn.emirate}</small>
                </span>
              </div>
              {unlocked && zn.price === low && zs.length > 1 ? <span className={s.cmpBest}>Lowest cost here</span> : null}
              <p className={s.cmpDesc}>{zn.d}</p>
              <dl>
                {rows.map(([label, cell]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{cell(zn)}</dd>
                  </div>
                ))}
              </dl>
              <div className={s.cmpActs}>
                <button type="button" className={s.cta} onClick={() => onCost(zn.id)}>
                  {unlocked ? null : <span className={s.ctaLock}>{LOCK_ICON}</span>}
                  {unlocked ? "Plan this zone" : "Get my cost"}
                </button>
                <button type="button" className={s.linkBtn} onClick={() => onRemove(zn.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
        {zs.length > 1 ? <p className={s.swipe}>Swipe to see each zone</p> : null}
      </div>
    </dialog>
  );
}

/* ---------- The explorer ---------- */

export function FzZones() {
  const { state, complete, goPlanner } = usePlanner();
  const unlocked = useEstimateUnlocked();
  const [group, setGroup] = useState<Group>("all");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [qs, setQs] = useState<SectorKey[] | null>(null);
  const [act, setAct] = useState<Activity | null>(null);
  const [sort, setSort] = useState<Sort>("price");
  const [cmp, setCmp] = useState<string[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  // Phones: the zone whose details are open under its card.
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [sugOpen, setSugOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [cmpOpen, setCmpOpen] = useState(false);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [away, setAway] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const debounce = useRef(0);

  /* Filtered, sorted list. */
  const list = useMemo(() => {
    const textOk = (zn: Zone) => {
      if (act) return zn.sect.includes(act[1]);
      if (!q) return true;
      if (HAY[zn.id].includes(q)) return true;
      return !!qs && qs.some((x) => zn.sect.includes(x));
    };
    return ZONES.filter((zn) => (group === "all" || zn.g.includes(group)) && textOk(zn)).sort((a, b) =>
      sort === "price" ? a.price - b.price : a.name.localeCompare(b.name),
    );
  }, [group, q, qs, act, sort]);

  // Keep a zone selected: the first in the list whenever the current one drops out.
  const current = list.find((zn) => zn.id === selId) ?? list[0] ?? null;
  const shownList = showAll ? list : list.slice(0, FIRST);

  /* Suggestions for the current input. */
  const sug = useMemo(() => {
    const v = input.trim();
    if (v.length < 2) return { acts: [] as Activity[], zones: [] as Zone[] };
    return {
      acts: findActs(v).slice(0, 6),
      zones: ZONES.filter((zn) => norm(`${zn.name} ${zn.short.join(" ")}`).includes(norm(v))).slice(0, 3),
    };
  }, [input]);
  const sugItems = useMemo(
    () => [...sug.acts.map((a) => ({ kind: "act" as const, a })), ...sug.zones.map((zn) => ({ kind: "zone" as const, zn }))],
    [sug],
  );

  /* The compare bar only shows while the explorer is on screen. */
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((e) => setAway(!e[e.length - 1].isIntersecting), { rootMargin: "0px 0px -15% 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(debounce.current), []);

  // Presets from outside the explorer (sitelink routes). Not visitor choices, so nothing is tracked.
  useEffect(() => {
    const onPreset = (e: Event) => {
      const { group: g, sort: so } = (e as CustomEvent<ZonesPreset>).detail ?? {};
      if (g) setGroup(g);
      if (so) setSort(so);
    };
    window.addEventListener(FZ_ZONES_PRESET, onPreset);
    return () => window.removeEventListener(FZ_ZONES_PRESET, onPreset);
  }, []);

  // Keep the highlighted suggestion in view.
  useEffect(() => {
    if (hi >= 0) document.getElementById(`zxSug-${hi}`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const openSug = () => {
    setSugOpen(true);
    setHi(-1);
  };
  const closeSug = () => {
    setSugOpen(false);
    setHi(-1);
  };

  const select = (id: string) => {
    setSelId(id);
    track("zone_select", { zone: ZONE_BY_ID[id].name });
    if (window.matchMedia(PHONE).matches) {
      const opening = openId !== id;
      setOpenId(opening ? id : null);
      if (opening) {
        requestAnimationFrame(() =>
          document.getElementById(`zx-${id}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }),
        );
      }
    }
  };

  const chooseAct = (a: Activity, source: "search" | "popular") => {
    setAct(a);
    setQ("");
    setQs(null);
    setInput(a[0]);
    setOpenId(null);
    closeSug();
    track("zone_activity_select", { activity: a[0], sector: a[1], source });
  };

  const clearAct = () => {
    setAct(null);
    setQ("");
    setQs(null);
    setInput("");
    inputRef.current?.focus();
  };

  const chooseZoneSug = (zn: Zone) => {
    closeSug();
    setAct(null);
    setQ(norm(zn.name));
    setQs(null);
    setInput(zn.name);
    select(zn.id);
  };

  const onInput = (v: string) => {
    setInput(v);
    if (act && v !== act[0]) setAct(null);
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      const t = v.trim();
      setQ(norm(t));
      setQs(t.length > 1 ? [...new Set(findActs(t).slice(0, 3).map((a) => a[1]))] : null);
      if (t.length > 1) openSug();
      else closeSug();
      if (t.length > 2) track("zone_activity_search", { query: t });
    }, 120);
  };

  const pickSug = (i: number) => {
    const item = sugItems[i];
    if (!item) return closeSug();
    if (item.kind === "act") chooseAct(item.a, "search");
    else chooseZoneSug(item.zn);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!sugOpen) return;
    const n = sugItems.length;
    if (e.key === "ArrowDown" && n) {
      e.preventDefault();
      setHi((h) => (h + 1 + n) % n);
    } else if (e.key === "ArrowUp" && n) {
      e.preventDefault();
      setHi((h) => (h - 1 + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickSug(hi >= 0 ? hi : 0);
    } else if (e.key === "Escape") closeSug();
  };

  // Up to three zones; adding a fourth drops the oldest.
  const toggleCmp = (id: string) => {
    const next = cmp.includes(id) ? cmp.filter((x) => x !== id) : [...cmp.slice(cmp.length >= 3 ? 1 : 0), id];
    setCmp(next);
    track("zone_compare_add", { count: next.length });
  };

  const openCmp = () => {
    setCmpOpen(true);
    track("zone_compare_open", { zones: cmp.map((id) => ZONE_BY_ID[id].name).join(",") });
    trackJurisdictionInterest("free_zone", "compare", { source: "zone_compare" });
  };
  const closeCmp = useCallback(() => setCmpOpen(false), []);

  // "Get my cost": the details popup the first time; once unlocked, the zone goes to the planner's full estimate.
  const cost = (id: string, source: "zone_card" | "compare" | "unlock_strip") => {
    track("zone_card_click", { zone: ZONE_BY_ID[id].name, source });
    setCmpOpen(false);
    if (unlocked) {
      goPlanner(id);
      return;
    }
    const input = cleanPlanner({ ...state, zone: id });
    complete(input, plannerEstimate(input), "zone_card");
    setUnlockId(id);
  };

  const unlockZone = unlockId ? ZONE_BY_ID[unlockId] : null;
  const zonesCovering = act ? list.length : 0;
  const likeActs = !act && q && qs?.length ? findActs(q).slice(0, 2).map((a) => a[0]) : [];
  const listKey = `${group}|${q}|${act?.[0] ?? ""}|${sort}`;
  let sugIndex = 0;

  const detailFor = (zn: Zone) => (
    <ZoneDetail
      key={`${zn.id}|${act?.[0] ?? ""}`}
      zone={zn}
      act={act}
      unlocked={unlocked}
      inCmp={cmp.includes(zn.id)}
      onCompare={() => toggleCmp(zn.id)}
      onCost={() => cost(zn.id, "zone_card")}
    />
  );

  return (
    <section className={`fz-block ${s.zx}`} id="zones" aria-labelledby="zonesTitle" ref={sectionRef}>
      <div className="wrap">
        <div className={s.head}>
          <span className={s.eyebrow}>Free zone explorer</span>
          <h2 id="zonesTitle">Explore all 28 free zones</h2>
          <p>Search what your business does and see the zones that cover it. Compare up to three side by side.</p>
        </div>

        {/* Search and filters */}
        <div className={s.tools}>
          <div className={s.searchWrap}>
            <label className={s.search}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                id="zxQ"
                placeholder="Search your activity, e.g. software, gold, cosmetics"
                aria-label="Search by business activity or free zone"
                autoComplete="off"
                role="combobox"
                aria-controls="zxSug"
                aria-expanded={sugOpen}
                aria-activedescendant={sugOpen && hi >= 0 ? `zxSug-${hi}` : undefined}
                value={input}
                onChange={(e) => onInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => input.trim().length > 1 && !act && openSug()}
                onBlur={() => window.setTimeout(closeSug, 120)}
              />
            </label>
            <div className={s.sug} id="zxSug" role="listbox" hidden={!sugOpen}>
              {!sugItems.length && (
                <div className={s.sugNone}>
                  <b>No match for “{input.trim()}”</b>
                  <span>Try a broader word like trading, consulting or marketing. Or ask us: we check 2,000+ activity codes.</span>
                </div>
              )}
              {sug.acts.length > 0 && <p className={s.sugH}>Activities</p>}
              {sug.acts.map((a) => {
                const i = sugIndex++;
                return (
                  <button
                    key={a[0]}
                    id={`zxSug-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === hi}
                    className={s.sugI}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chooseAct(a, "search")}
                  >
                    <ActIcon name={a[0]} className={s.sugIc} />
                    <span className={s.sugT}>
                      <b>{highlight(a[0], input.trim())}</b>
                      <small>
                        {SECT[a[1]]}
                        {a[3] ? " · extra regulator sign-off" : ""}
                      </small>
                    </span>
                    <span className={s.sugN}>{zonesForSector(a[1])} zones</span>
                  </button>
                );
              })}
              {sug.zones.length > 0 && <p className={s.sugH}>Free zones</p>}
              {sug.zones.map((zn) => {
                const i = sugIndex++;
                return (
                  <button
                    key={zn.id}
                    id={`zxSug-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === hi}
                    className={s.sugI}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chooseZoneSug(zn)}
                  >
                    <ZoneLogo zone={zn} size="zl-sug" />
                    <span className={s.sugT}>
                      <b>{highlight(zn.name, input.trim())}</b>
                      <small>{zn.emirate}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={s.chipRow} role="group" aria-label="Filter free zones">
            {FILTERS.map((f) => (
              <button
                key={f.g}
                type="button"
                className={s.filter}
                aria-pressed={group === f.g}
                onClick={() => {
                  setGroup(f.g);
                  setOpenId(null);
                  track("zone_filter", { group: f.g });
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className={s.chipRow} role="group" aria-label="Popular activities">
            <span className={s.popLabel}>Popular</span>
            {POPULAR_ACTS.map((name) => (
              <button
                key={name}
                type="button"
                className={s.pop}
                aria-pressed={act?.[0] === name}
                onClick={() => {
                  const a = ACTS.find((x) => x[0] === name);
                  if (a) chooseAct(a, "popular");
                }}
              >
                <ActIcon name={name} className={s.popIc} />
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className={s.actNote} aria-live="polite" hidden={!act && !likeActs.length}>
          {act ? (
            <>
              <span className={s.actChip}>
                <ActIcon name={act[0]} className={s.popIc} />
                <b>{act[0]}</b>
                <button type="button" aria-label="Clear activity" onClick={clearAct}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </span>
              <span>
                {zonesCovering}
                {zonesCovering === 1 ? " zone covers" : " zones typically cover"} this activity. Your advisor confirms the exact activity code.
                {act[3] ? " It may need an extra regulator sign-off; we check this for you." : ""}
              </span>
            </>
          ) : likeActs.length ? (
            <span>Showing zones for activities like {likeActs.join(" and ")}</span>
          ) : null}
        </div>

        {/* One quick form unlocks every price */}
        {unlocked ? null : (
          <div className={s.unlockStrip}>
            <span className={s.unlockIc}>{LOCK_ICON}</span>
            <span className={s.unlockText}>
              <b>Prices for all 28 zones are locked</b>
              <small>One quick form shows every price, renewal and multi-year package.</small>
            </span>
            <button type="button" className={s.cta} onClick={() => current && cost(current.id, "unlock_strip")}>
              Unlock all prices {ARROW}
            </button>
          </div>
        )}

        <div className={s.shell}>
          <div className={s.listWrap}>
            <div className={s.listHead}>
              <p aria-live="polite">
                <b>{list.length}</b> of 28 zones
              </p>
              <div className={s.sort} role="group" aria-label="Sort">
                <button type="button" aria-pressed={sort === "price"} onClick={() => setSort("price")}>
                  Lowest cost first
                </button>
                <button type="button" aria-pressed={sort === "name"} onClick={() => setSort("name")}>
                  A to Z
                </button>
              </div>
            </div>

            <ul className={s.list} aria-label="Free zones" key={listKey}>
              {shownList.map((zn, k) => {
                const inCmp = cmp.includes(zn.id);
                const sel = current?.id === zn.id;
                const open = openId === zn.id;
                return (
                  <li key={zn.id} id={`zx-${zn.id}`} className={s.item} style={{ "--k": Math.min(k, 10) } as CSSProperties}>
                    <div className={`${s.row}${sel ? ` ${s.sel}` : ""}${open ? ` ${s.open}` : ""}`}>
                      <button type="button" className={s.rowMain} aria-expanded={open} aria-current={sel || undefined} onClick={() => select(zn.id)}>
                        <ZoneLogo zone={zn} size="zl-row" />
                        <span className={s.rowT}>
                          <b>{zn.name}</b>
                          <small>
                            {EM_SHORT[zn.emirate]} · {zn.t.slice(0, 2).map((t) => ACT_LABEL[t]).join(", ")}
                          </small>
                        </span>
                        <span className={s.rowP}>
                          <small>from</small>
                          <b>
                            <LockedFigure text={`AED ${formatAED(zn.price)}`} unlocked={unlocked} />
                          </b>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={s.plus}
                        aria-pressed={inCmp}
                        aria-label={inCmp ? `Remove ${zn.name} from compare` : `Add ${zn.name} to compare`}
                        onClick={() => toggleCmp(zn.id)}
                      >
                        {inCmp ? CHECK : PLUS}
                      </button>
                    </div>
                    {/* Phones: the details open right under the card. */}
                    {open ? <div className={s.inline}>{detailFor(zn)}</div> : null}
                  </li>
                );
              })}
            </ul>
            {!showAll && list.length > FIRST ? (
              <button type="button" className={s.showAll} onClick={() => setShowAll(true)}>
                Show all {list.length} zones
              </button>
            ) : null}

            <div className={s.empty} hidden={list.length > 0}>
              <b>
                No zone matches “<span>{act ? act[0] : q}</span>” with these filters
              </b>
              <p>Try the All zones filter. Not sure what your activity is called? Our advisors check it against 2,000+ activity codes.</p>
              <CallbackTrigger className="btn btn-primary" location="FZ Zones — Ask an Advisor">
                Ask an Advisor
              </CallbackTrigger>
            </div>
          </div>

          <aside className={s.aside} aria-live="polite" hidden={!current}>
            {current && detailFor(current)}
          </aside>
        </div>
      </div>

      {/* Compare bar */}
      <div className={`${s.tray}${away ? ` ${s.away}` : ""}`} hidden={!cmp.length}>
        <div className={s.trayIn}>
          <ul className={s.trayZones}>
            {cmp.map((id) => (
              <li key={id}>
                <ZoneLogo zone={ZONE_BY_ID[id]} size="zl-sug" alt={false} />
                <span>{ZONE_BY_ID[id].short[0]}</span>
              </li>
            ))}
          </ul>
          <button type="button" className={s.cta} onClick={openCmp}>
            Compare {cmp.length}
          </button>
          <button type="button" className={s.linkBtn} onClick={() => setCmp([])}>
            Clear
          </button>
        </div>
      </div>

      {cmpOpen && cmp.length > 0 && (
        <CompareSheet ids={cmp} unlocked={unlocked} onClose={closeCmp} onCost={(id) => cost(id, "compare")} onRemove={(id) => toggleCmp(id)} />
      )}

      <UnlockDialog
        open={!!unlockZone}
        onClose={() => setUnlockId(null)}
        sent={unlocked}
        intro="Send your details and every free zone price appears straight away. No obligation."
        tags={unlockZone ? [unlockZone.name, unlockZone.emirate] : undefined}
      >
        {unlockZone ? (
          <QuickCapture
            key={unlockZone.id}
            formId={FZ_FORM_ID}
            service="free_zone"
            tone="light"
            cta="Show all prices"
            payload={() => ({ planner: cleanPlanner({ ...state, zone: unlockZone.id }) })}
            summary={`${unlockZone.name}${unlocked ? `, from AED ${formatAED(unlockZone.price)}` : ""}`}
            onSent={() => window.setTimeout(() => setUnlockId(null), UNLOCK_THANKS_MS)}
            onDone={() => setUnlockId(null)}
          />
        ) : null}
      </UnlockDialog>
    </section>
  );
}
