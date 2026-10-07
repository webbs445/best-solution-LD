"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
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
import { PRICE_MAX, PRICE_MIN, findActs, maxPack, norm, renewalFor, zoneHaystack, zonesForSector } from "@/lib/freezone";
import { formatAED } from "@/lib/pricing";
import { trackEvent, trackJurisdictionInterest } from "@/lib/analytics";
import { prefersReducedMotion } from "@/lib/useReducedMotion";
import { CallbackTrigger } from "./CallbackTrigger";
import { ZoneLogo } from "./ZoneLogo";
import { FzZoneEstimate } from "./FzZoneEstimate";

type Group = "all" | ZoneGroup;
type Sort = "price" | "name";

/** Dispatch on window (a CustomEvent with this detail) to preset the explorer, e.g. from a sitelink route. */
export const FZ_ZONES_PRESET = "fz-zones-preset";
export interface ZonesPreset {
  group?: Group;
  sort?: Sort;
}

const FILTERS: { g: Group; label: string }[] = [
  { g: "all", label: "All" },
  { g: "value", label: "Cost-efficient" },
  { g: "dubai", label: "Dubai" },
  { g: "sector", label: "Specialist" },
  { g: "trade", label: "Trade" },
  { g: "finance", label: "Financial" },
];

const BUDGET = { min: 5000, max: 50000, step: 1000 };

/* Normalised like the query (norm), so "IFZA (Dubai)" finds "ifza dubai". */
const HAY = Object.fromEntries(ZONES.map((zn) => [zn.id, norm(zoneHaystack(zn))]));

/* Lucide icon for a business activity. */
function ActIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`lic${className ? ` ${className}` : ""}`} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: activityIcon(name) }}
      />
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

const track = trackEvent;

/* ---------- Zone detail (right-hand panel) ---------- */

function ZoneDetail({
  zone,
  act,
  inCmp,
  onCompare,
  onEstimate,
}: {
  zone: Zone;
  act: Activity | null;
  inCmp: boolean;
  onCompare: () => void;
  onEstimate: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [dot, setDot] = useState(0);
  const pk = PK[zone.id];
  const mp = maxPack(zone);
  const pos = Math.round(((Math.log(zone.price) - Math.log(PRICE_MIN)) / (Math.log(PRICE_MAX) - Math.log(PRICE_MIN))) * 100);
  const base = zone.exact ? zone.exact["0"] : zone.price;

  useEffect(() => {
    const t = window.setTimeout(() => setDot(pos), 30);
    return () => window.clearTimeout(t);
  }, [pos]);

  const facts: [string, string][] = [
    ["Residency", mp !== null ? `Package covers up to ${mp} people` : `AED ${formatAED(RATES.residencyPerPerson)} per person`],
    ["Year-two renewal", `About AED ${formatAED(renewalFor(zone))}`],
    ["Workspace", "Flexi-desk, included"],
    ...(pk
      ? ([
          ["Activities", pk.actTxt],
          ["Shareholders", pk.shTxt],
        ] as [string, string][])
      : ([["Price basis", "Catalogue estimate"]] as [string, string][])),
    ...(act
      ? ([["Your activity", `${zone.sect.includes(act[1]) ? "Typically covered: " : "Not typically covered: "}${act[0]}`]] as [string, string][])
      : []),
  ];

  // "Best known for": the visitor's activity sector first (if covered), then the zone's own strengths.
  const lead: SectorKey[] = [];
  if (act && zone.sect.includes(act[1])) lead.push(act[1]);
  zone.t.forEach((t) => {
    if (!lead.includes(t) && zone.sect.includes(t)) lead.push(t);
  });
  const shownLead = lead.slice(0, 3);
  const rest = zone.sect.filter((t) => !shownLead.includes(t));
  const chip = (t: SectorKey, more?: boolean) => (
    <span key={t} className={`${act && act[1] === t ? "on" : ""}${more ? " more" : ""}`.trim() || undefined}>
      {SECT[t] || ACT_LABEL[t as keyof typeof ACT_LABEL] || t}
    </span>
  );

  return (
    <div className="zd">
      <div className="zd-top">
        <ZoneLogo zone={zone} size="zl-xl" />
        <div>
          <span className="zd-em">{zone.emirate}</span>
          <h3>{zone.name}</h3>
        </div>
      </div>
      <p className="zd-desc">{zone.d}</p>
      <div className="zd-price">
        <div>
          <small>From</small>
          <b>AED {formatAED(zone.price)}</b>
        </div>
        <span className="zd-inc">
          <svg viewBox="0 0 24 24">
            <path d="m5 12 5 5L20 7" />
          </svg>
          Flexi-desk included
        </span>
      </div>
      <div className="zd-meter">
        <div className="zd-meter-tr">
          <i style={{ left: `${dot}%` }} />
        </div>
        <div className="zd-meter-l">
          <span>Lower cost</span>
          <span>Premium</span>
        </div>
      </div>
      <dl className="zd-facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {pk?.years && (
        <>
          <p className="zd-sub">Multi-year package, no residency</p>
          <div className="zd-years">
            <span>
              <small>1 year</small>
              <b>AED {formatAED(base)}</b>
            </span>
            {pk.years.map(([y, total]) => (
              <span key={y}>
                <small>{y} years</small>
                <b>AED {formatAED(total)}</b>
                {/* Show a multi-year saving only when it is meaningful (2%+), not rounding-level differences. */}
                {base * y - total >= base * y * 0.02 && <em>Save AED {formatAED(base * y - total)}</em>}
              </span>
            ))}
          </div>
        </>
      )}
      {pk?.note && <p className="zd-note">{pk.note}</p>}
      <div className="zd-secthead">
        <p className="zd-sub">Known for</p>
      </div>
      <div className="zd-tags">
        {shownLead.map((t) => chip(t))}
        {moreOpen && rest.map((t) => chip(t, true))}
        {rest.length > 0 && (
          <button type="button" className="zd-more" aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)}>
            {moreOpen ? "Show less" : `+${rest.length} more`}
          </button>
        )}
      </div>
      <div className="zd-actions">
        <button type="button" className="btn btn-primary" onClick={onEstimate}>
          Get My Estimate
        </button>
        <button type="button" className="zd-cmp" aria-pressed={inCmp} onClick={onCompare}>
          {inCmp ? "Added to compare" : "Add to compare"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Side-by-side comparison ---------- */

function CompareModal({ ids, onClose, onEstimate }: { ids: string[]; onClose: () => void; onEstimate: (id: string) => void }) {
  const close = useRef<HTMLButtonElement>(null);
  const zs = ids.map((id) => ZONE_BY_ID[id]);
  const low = Math.min(...zs.map((zn) => zn.price));

  useEffect(() => {
    const last = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      last?.focus();
    };
  }, [onClose]);

  const rows: [string, (zn: Zone) => ReactNode][] = [
    [
      "",
      (zn) => (
        <span className="zx-th">
          <ZoneLogo zone={zn} size="zl-cmp" />
          <b>{zn.name}</b>
        </span>
      ),
    ],
    ["Emirate", (zn) => <span>{zn.emirate}</span>],
    ["Suited to", (zn) => <span>{zn.d}</span>],
    [
      "From-price",
      (zn) => (
        <span className={zn.price === low ? "best" : undefined}>
          AED {formatAED(zn.price)}
          {zn.price === low ? "  Least expensive here" : ""}
        </span>
      ),
    ],
    ["Year-two renewal", (zn) => <span>About AED {formatAED(renewalFor(zn))}</span>],
    ["Workspace", () => <span>Flexi-desk included</span>],
    ["Activities", (zn) => <span>{PK[zn.id]?.actTxt ?? "Confirmed by advisor"}</span>],
    ["Shareholders", (zn) => <span>{PK[zn.id]?.shTxt ?? "Confirmed by advisor"}</span>],
    [
      "Residency",
      (zn) => {
        const m = maxPack(zn);
        return <span>{m !== null ? `Package covers up to ${m} people` : "Priced per person"}</span>;
      },
    ],
    [
      "",
      (zn) => (
        <span>
          <button type="button" onClick={() => onEstimate(zn.id)}>
            Get this estimate
          </button>
        </span>
      ),
    ],
  ];

  return (
    <div className="zx-modal">
      <div className="zx-back" onClick={onClose} />
      <div className="zx-sheet" role="dialog" aria-modal="true" aria-labelledby="zxmTitle">
        <div className="zx-sheet-h">
          <h3 id="zxmTitle">Side-by-side comparison</h3>
          <button ref={close} type="button" className="cb-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="zx-table" style={{ "--n": zs.length } as CSSProperties}>
          {rows.map(([label, cell], r) => (
            <div className="zx-tr" key={r}>
              <span>{label}</span>
              {zs.map((zn) => (
                <Fragment key={zn.id}>{cell(zn)}</Fragment>
              ))}
            </div>
          ))}
        </div>
        <p className="fz-micro">Indicative rate-card prices. Your advisor confirms the right zone and the final cost in writing.</p>
      </div>
    </div>
  );
}

/* ---------- The explorer ---------- */

export function FzZones() {
  const [group, setGroup] = useState<Group>("all");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [qs, setQs] = useState<SectorKey[] | null>(null);
  const [act, setAct] = useState<Activity | null>(null);
  const [max, setMax] = useState(BUDGET.max);
  const [sort, setSort] = useState<Sort>("price");
  const [cmp, setCmp] = useState<string[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [sugOpen, setSugOpen] = useState(false);
  const [sugPop, setSugPop] = useState(0);
  const [hi, setHi] = useState(-1);
  const [modal, setModal] = useState(false);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const closeEstimate = useCallback(() => setEstimateId(null), []);
  const [away, setAway] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const debounce = useRef(0);

  /* Filtered, sorted list. */
  const list = useMemo(() => {
    const textOk = (zn: Zone) => {
      if (act) return zn.sect.includes(act[1]);
      if (!q) return true;
      if (HAY[zn.id].includes(q)) return true;
      return !!qs && qs.some((s) => zn.sect.includes(s));
    };
    return ZONES.filter((zn) => (group === "all" || zn.g.includes(group)) && zn.price <= max && textOk(zn)).sort((a, b) =>
      sort === "price" ? a.price - b.price : a.name.localeCompare(b.name),
    );
  }, [group, q, qs, act, max, sort]);

  // Keep a zone selected: the first in the list whenever the current one drops out.
  const current = list.find((zn) => zn.id === selId) ?? list[0] ?? null;

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

  /* Filter pill follows the pressed filter button. */
  const movePill = useCallback(() => {
    const active = filterRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    const p = pillRef.current;
    if (!active || !p) return;
    p.style.width = `${active.offsetWidth}px`;
    p.style.transform = `translateX(${active.offsetLeft}px)`;
  }, []);
  useLayoutEffect(() => movePill(), [group, movePill]);
  useEffect(() => {
    window.addEventListener("resize", movePill);
    const t = window.setTimeout(movePill, 80);
    return () => {
      window.removeEventListener("resize", movePill);
      window.clearTimeout(t);
    };
  }, [movePill]);

  /* The compare tray tucks away while the explorer is off screen. */
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((e) => setAway(!e[e.length - 1].isIntersecting), { rootMargin: "0px 0px -20% 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(debounce.current), []);

  // Presets from outside the explorer (sitelink routes). Not visitor choices, so nothing is tracked.
  useEffect(() => {
    const onPreset = (e: Event) => {
      const { group: g, sort: s } = (e as CustomEvent<ZonesPreset>).detail ?? {};
      if (g) setGroup(g);
      if (s) setSort(s);
    };
    window.addEventListener(FZ_ZONES_PRESET, onPreset);
    return () => window.removeEventListener(FZ_ZONES_PRESET, onPreset);
  }, []);

  const openSug = () => {
    if (!sugOpen) setSugPop((n) => n + 1);
    setSugOpen(true);
    setHi(-1);
  };
  const closeSug = () => {
    setSugOpen(false);
    setHi(-1);
  };

  const select = (id: string, user: boolean) => {
    setSelId(id);
    if (user) {
      track("zone_select", { zone: ZONE_BY_ID[id].name });
      if (window.matchMedia("(max-width:900px)").matches) {
        requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }));
      }
    }
  };

  const chooseAct = (a: Activity, source: "search" | "popular") => {
    setAct(a);
    setQ("");
    setQs(null);
    setInput(a[0]);
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
    select(zn.id, true);
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

  // Keep the highlighted suggestion in view.
  useEffect(() => {
    if (hi >= 0) document.getElementById(`zxSug-${hi}`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  // Up to three zones; adding a fourth drops the oldest.
  const toggleCmp = (id: string) => {
    const next = cmp.includes(id) ? cmp.filter((x) => x !== id) : [...cmp.slice(cmp.length >= 3 ? 1 : 0), id];
    setCmp(next);
    track("zone_compare_add", { count: next.length });
  };

  const openCmp = () => {
    setModal(true);
    track("zone_compare_open", { zones: cmp.map((id) => ZONE_BY_ID[id].name).join(",") });
    trackJurisdictionInterest("free_zone", "compare", { source: "zone_compare" });
  };
  const closeCmp = useCallback(() => setModal(false), []);

  // "Get This Estimate in Writing": the request opens right here, with the zone filled in.
  const estimate = (id: string, source: "zone_card" | "compare") => {
    track("zone_card_click", { zone: ZONE_BY_ID[id].name, source });
    setEstimateId(id);
  };

  const zonesCovering = act ? list.length : 0;
  const likeActs = !act && q && qs?.length ? findActs(q).slice(0, 2).map((a) => a[0]) : [];
  const listKey = `${group}|${q}|${act?.[0] ?? ""}|${max}|${sort}`;
  let sugIndex = 0;

  return (
    <section className="fz-block zx" id="zones" aria-labelledby="zonesTitle" ref={sectionRef}>
      <div className="wrap">
        <div className="fz-head-split">
          <h2 id="zonesTitle">Explore all 28 free zones</h2>
          <p>
            Search what your business does. We show the zones that cover it, with prices that include a flexi-desk.
            Compare up to three side by side.
          </p>
        </div>
        <div className="zx-tools">
          <div className="zx-searchwrap">
            <label className="zx-search">
              <svg viewBox="0 0 24 24">
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
            <div className={`zx-sug${sugPop ? " pop" : ""}`} id="zxSug" role="listbox" hidden={!sugOpen} key={sugPop}>
              {!sugItems.length && (
                <div className="zx-sug-none">
                  <b>No match for “{input.trim()}”</b>
                  <span>Try a broader word like trading, consulting or marketing. Or ask us: we check 2,000+ activity codes.</span>
                </div>
              )}
              {sug.acts.length > 0 && <p className="zx-sug-h">Activities</p>}
              {sug.acts.map((a) => {
                const i = sugIndex++;
                return (
                  <button
                    key={a[0]}
                    id={`zxSug-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === hi}
                    className={`zx-sug-i${i === hi ? " hi" : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chooseAct(a, "search")}
                  >
                    <ActIcon name={a[0]} className={`zx-sug-ic s-${a[1]}`} />
                    <span className="zx-sug-t">
                      <b>{highlight(a[0], input.trim())}</b>
                      <small>
                        {SECT[a[1]]}
                        {a[3] ? " · extra regulator sign-off" : ""}
                      </small>
                    </span>
                    <span className="zx-sug-n">{zonesForSector(a[1])} zones</span>
                  </button>
                );
              })}
              {sug.zones.length > 0 && <p className="zx-sug-h">Free zones</p>}
              {sug.zones.map((zn) => {
                const i = sugIndex++;
                return (
                  <button
                    key={zn.id}
                    id={`zxSug-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === hi}
                    className={`zx-sug-i${i === hi ? " hi" : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chooseZoneSug(zn)}
                  >
                    <ZoneLogo zone={zn} size="zl-sug" />
                    <span className="zx-sug-t">
                      <b>{highlight(zn.name, input.trim())}</b>
                      <small>{zn.emirate}</small>
                    </span>
                    <span className="zx-sug-n">AED {formatAED(zn.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="fz-filter" role="group" aria-label="Filter free zones" id="fzFilter" ref={filterRef}>
            <span className="fz-pill" aria-hidden="true" ref={pillRef} />
            {FILTERS.map((f) => (
              <button
                key={f.g}
                type="button"
                data-g={f.g}
                aria-pressed={group === f.g}
                onClick={() => {
                  setGroup(f.g);
                  track("zone_filter", { group: f.g });
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="zx-budget">
            <label htmlFor="zxMax">
              Budget up to <b>AED {formatAED(max)}</b>
            </label>
            <input
              type="range"
              id="zxMax"
              min={BUDGET.min}
              max={BUDGET.max}
              step={BUDGET.step}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              onPointerUp={() => track("zone_budget", { max })}
              onKeyUp={() => track("zone_budget", { max })}
            />
          </div>
        </div>
        <div className="zx-pop">
          <span>Popular</span>
          {POPULAR_ACTS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                const a = ACTS.find((x) => x[0] === name);
                if (a) chooseAct(a, "popular");
              }}
            >
              <ActIcon name={name} />
              {name}
            </button>
          ))}
        </div>
        <div className="zx-act" aria-live="polite" hidden={!act && !likeActs.length}>
          {act ? (
            <>
              <span className="zx-act-chip">
                <ActIcon name={act[0]} className="zx-chip-ic" />
                <small>Activity</small>
                <b>{act[0]}</b>
                <button type="button" className="zx-act-x" aria-label="Clear activity" onClick={clearAct} />
              </span>
              <span className="zx-act-n">
                {zonesCovering}
                {zonesCovering === 1 ? " zone covers" : " zones typically cover"} this activity. Your advisor confirms the
                exact activity code.
              </span>
              {act[3] && <span className="zx-act-r">May need an extra regulator sign-off. We check this for you.</span>}
            </>
          ) : likeActs.length ? (
            <span className="zx-act-n">Showing zones for activities like {likeActs.join(" and ")}</span>
          ) : null}
        </div>
        <div className="zx-shell">
          <div className="zx-listwrap">
            <div className="zx-listhead">
              <p className="zx-count" aria-live="polite">
                <b>{list.length}</b> of 28 zones
              </p>
              <div className="zx-sort" role="group" aria-label="Sort">
                <button type="button" data-s="price" aria-pressed={sort === "price"} onClick={() => setSort("price")}>
                  Price, low to high
                </button>
                <button type="button" data-s="name" aria-pressed={sort === "name"} onClick={() => setSort("name")}>
                  A to Z
                </button>
              </div>
            </div>
            <ul className="zx-list" id="fzZones" role="listbox" aria-label="Free zones" key={listKey}>
              {list.map((zn, k) => {
                const on = cmp.includes(zn.id);
                return (
                  <li key={zn.id} className={`zx-item${on ? " sel" : ""}`} style={{ "--k": Math.min(k, 10) } as CSSProperties}>
                    <button
                      type="button"
                      className="zx-row"
                      role="option"
                      aria-selected={current?.id === zn.id}
                      onClick={() => select(zn.id, true)}
                    >
                      <ZoneLogo zone={zn} size="zl-row" />
                      <span className="zx-row-t">
                        <b>{zn.name}</b>
                        <small>
                          {EM_SHORT[zn.emirate]} · {zn.t.slice(0, 2).map((t) => ACT_LABEL[t]).join(", ")}
                        </small>
                      </span>
                      <span className="zx-row-p">
                        <small>from</small>
                        <b>AED {formatAED(zn.price)}</b>
                      </span>
                      <span className="zx-row-go" />
                    </button>
                    <button
                      type="button"
                      className="zx-plus"
                      aria-pressed={on}
                      aria-label={`Add ${zn.name} to compare`}
                      title="Compare"
                      onClick={() => toggleCmp(zn.id)}
                    />
                  </li>
                );
              })}
            </ul>
            <div className="zx-empty" hidden={list.length > 0}>
              <b>
                No zone matches “<span>{act ? act[0] : q}</span>” with these filters
              </b>
              <p>
                Try a higher budget or the All filter. Not sure what your activity is called? Our advisors check it
                against 2,000+ activity codes.
              </p>
              <CallbackTrigger className="btn btn-primary" location="FZ Zones — Ask an Advisor">
                Ask an Advisor
              </CallbackTrigger>
            </div>
          </div>
          <aside className="zx-detail" aria-live="polite" hidden={!current} ref={detailRef}>
            {current && (
              <ZoneDetail
                key={`${current.id}|${act?.[0] ?? ""}`}
                zone={current}
                act={act}
                inCmp={cmp.includes(current.id)}
                onCompare={() => toggleCmp(current.id)}
                onEstimate={() => estimate(current.id, "zone_card")}
              />
            )}
          </aside>
        </div>
      </div>
      <div className={`zx-tray${away ? " is-away" : ""}`} hidden={!cmp.length}>
        <div className="zx-tray-in">
          <div className="zx-chips">
            {cmp.map((id) => (
              <span key={id}>{ZONE_BY_ID[id].name}</span>
            ))}
          </div>
          <button type="button" className="btn btn-primary" onClick={openCmp}>
            Compare <span>{cmp.length}</span>
          </button>
          <button type="button" className="zx-clear" onClick={() => setCmp([])}>
            Clear
          </button>
        </div>
      </div>
      {modal && cmp.length > 0 && (
        <CompareModal
          ids={cmp}
          onClose={closeCmp}
          onEstimate={(id) => {
            closeCmp();
            estimate(id, "compare");
          }}
        />
      )}
      <FzZoneEstimate key={estimateId ?? "closed"} zoneId={estimateId} onClose={closeEstimate} />
    </section>
  );
}
