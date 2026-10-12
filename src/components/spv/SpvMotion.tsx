"use client";

import { useEffect } from "react";
import { SITE } from "@/content/site";
import { SPV_PREFILL_EVENT, type SpvAssets, type SpvGoal, type SpvPrefill } from "@/content/spv";
import { trackEvent } from "@/lib/analytics";

/*
  Everything that moves on /spv, ported from the structuring landing page's script: headline word
  reveals, header/dock on scroll, the mobile menu, scroll reveals, the hero structure map, the stamp
  marquee, the compare slider, the layer tower, pillar rows, compare panels, the fit finder, the
  process path, tilt and spotlight effects. It works on the server-rendered markup by id and class.
  Contact clicks, CTA clicks and form_start come from AnalyticsInit; the FAQ and the form are React.
  Every listener, timer and observer is removed when the page unmounts.
*/

const MAP: Record<string, { n: [string, string][]; c: string }> = {
  family: {
    n: [["You and your family", "Founder"], ["Private foundation", "DIFC, ADGM, DMCC or RAK ICC"], ["Holding company", "Owned by the foundation"], ["Family business", "Shares"], ["Property", "Real estate"], ["Investments", "Portfolio"]],
    c: "A foundation sits at the top with rules you write. It owns a holding company, which holds the business, property and investments for your family.",
  },
  property: {
    n: [["You", "Investor"], ["Holding company", "One owner for all"], ["Property SPVs", "One per asset"], ["Villa", "SPV 1"], ["Apartment", "SPV 2"], ["Office", "SPV 3"]],
    c: "Each property sits in its own SPV under one holding company, so a sale or an issue with one asset is kept apart from the others.",
  },
  business: {
    n: [["Founders and partners", "Shareholders"], ["Holding company", "Group parent"], ["Operating layer", "Trading companies"], ["UAE company", "Trading"], ["Overseas company", "International"], ["IP company", "Brand and IP"]],
    c: "One holding company owns the group. Trading companies run the business, while valuable assets like IP sit separately.",
  },
};

const IC: Record<string, string> = {
  fam: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  prop: '<path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6"/>',
  biz: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  deal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  uae: '<path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>',
  abroad: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  both: '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  family: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c1-3 3-5 6-5s5 2 6 5M10 20c1-3 3-5 6-5s5 2 6 5"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
};
const FQ: { q: string; o: [string, string, string][] }[] = [
  { q: "What do you want the structure to do?", o: [["fam", "Protect family wealth", "Succession and legacy"], ["prop", "Hold property", "One or more real estate assets"], ["biz", "Organise a business group", "Several companies or partners"], ["deal", "Ring-fence one deal", "A project, JV or single asset"]] },
  { q: "Where are the assets today?", o: [["uae", "In the UAE", "Property, companies or accounts here"], ["abroad", "Outside the UAE", "Investments in other countries"], ["both", "Both", "A mix of UAE and overseas"]] },
  { q: "Who should make the decisions?", o: [["me", "Just me", "You keep full control"], ["family", "My family", "Decisions shared across generations"], ["board", "Partners or a board", "Several people have a say"]] },
];
const NAMES: Record<string, string> = { foundation: "Private foundation", holding: "Holding company", spv: "SPV", offshore: "Offshore company" };
const GOAL_OF: Record<string, SpvGoal> = { fam: "Family wealth and succession", prop: "Property", biz: "Business group", deal: "A single deal or asset", off: "Not sure yet" };
const ASSETS_OF: Record<string, SpvAssets> = { uae: "In the UAE", abroad: "Outside the UAE", both: "Both" };

function fxPlan(a: string[]) {
  const [g, w, c] = a;
  let st: string[] = [];
  let why = "";
  if (!g) return { st, why };
  if (g === "fam") {
    st = ["foundation", "holding"];
    why = "A foundation sets the rules for your family. A holding company underneath keeps businesses and assets organised.";
  } else if (g === "prop") {
    st = ["holding", "spv"];
    why = "An SPV for each property holds every asset separately, with one holding company above them.";
    if (c === "family") {
      st.unshift("foundation");
      why = "A foundation for the family, a holding company below it and an SPV for each property.";
    }
  } else if (g === "biz") {
    st = ["holding", "spv"];
    why = "One holding company owns the group, with separate vehicles for valuable assets like IP.";
    if (c === "family") {
      st.unshift("foundation");
      why = "A foundation above the holding company keeps family control clear as the group grows.";
    }
  } else {
    st = ["spv"];
    why = "A single SPV keeps the deal in its own vehicle, so it can be sold or closed separately.";
    if (c === "board") {
      st.unshift("holding");
      why = "A holding company for the partners, with an SPV for the deal itself.";
    }
  }
  if (w && w !== "uae" && !st.includes("offshore")) {
    st.push("offshore");
    why += " With assets outside the UAE, an offshore company is often discussed for the international part.";
  }
  return { st, why };
}

const prefill = (detail: SpvPrefill) => window.dispatchEvent(new CustomEvent<SpvPrefill>(SPV_PREFILL_EVENT, { detail }));

export function SpvMotion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".spv-page");
    if (!page) return;
    const ac = new AbortController();
    const on = <K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: (e: never) => void, opts: AddEventListenerOptions = {}) =>
      t.addEventListener(type, fn as EventListener, { ...opts, signal: ac.signal });
    const timers: number[] = [];
    const intervals: number[] = [];
    const observers: IntersectionObserver[] = [];
    let alive = true;
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const every = (fn: () => void, ms: number) => {
      const id = window.setInterval(fn, ms);
      intervals.push(id);
      return id;
    };
    const observe = (cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) => {
      const io = new IntersectionObserver(cb, opts);
      observers.push(io);
      return io;
    };
    const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = page) => c.querySelector<T>(s) as T;
    const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = page) => Array.from(c.querySelectorAll<T>(s));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer:fine)").matches;
    const fontsReady = (fn: () => void) => document.fonts?.ready.then(() => alive && fn());

    /* hero headline: word by word */
    {
      const h = $("#h1");
      let i = 0;
      const wrap = (node: Node) => {
        Array.from(node.childNodes).forEach((n) => {
          if (n.nodeType === 3) {
            const f = document.createDocumentFragment();
            (n.textContent || "").split(/(\s+)/).forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(p));
              else {
                const s = document.createElement("span");
                s.className = "w";
                s.style.animationDelay = i++ * 55 + "ms";
                s.textContent = p;
                f.appendChild(s);
              }
            });
            n.parentNode?.replaceChild(f, n);
          } else if (n.nodeType === 1) {
            const el = n as HTMLElement;
            if (el.classList.contains("cu")) {
              el.classList.add("w");
              el.style.animationDelay = i++ * 55 + "ms";
            } else wrap(el);
          }
        });
      };
      if (h && !h.dataset.split) {
        h.dataset.split = "1";
        wrap(h);
      }
    }

    /* drawer */
    const burger = $("#burger");
    const drawer = $("#drawer");
    const closeDrawer = () => {
      if (drawer.classList.contains("open")) {
        drawer.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    };
    on(burger, "click", () => {
      const o = drawer.classList.toggle("open");
      burger.setAttribute("aria-expanded", o ? "true" : "false");
    });
    $$("#drawer a").forEach((a) => on(a, "click", closeDrawer));

    /* reveal: starts while a block is still 20% below the screen, so it is readable by the time it scrolls in */
    const io = observe(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0, rootMargin: "0px 0px 20% 0px" },
    );
    $$(".rv,.idx,.stp,.vault,.ft-big,.head").forEach((el) => io.observe(el));

    /* hero structure map */
    const mNodes = $$<SVGGElement>("#mapSvg .node");
    const segB = $$<HTMLButtonElement>("#mapSeg button");
    const mapInk = $("#mapInk");
    const cap = $("#mapCap");
    let curS = "family";
    let mapTimer = 0;
    const moveMapInk = () => {
      const a = $<HTMLButtonElement>('#mapSeg button[aria-selected="true"]');
      if (!a) return;
      mapInk.style.left = a.offsetLeft + "px";
      mapInk.style.width = a.offsetWidth + "px";
    };
    const paintMap = (k: string) => {
      const d = MAP[k];
      mNodes.forEach((g, i) => {
        const t = $$<SVGTextElement>("text", g);
        t[0].textContent = d.n[i][0];
        t[1].textContent = d.n[i][1];
      });
      cap.textContent = d.c;
    };
    const setMap = (k: string, user: boolean) => {
      if (k === curS && user) return;
      curS = k;
      segB.forEach((b) => b.setAttribute("aria-selected", b.dataset.s === k ? "true" : "false"));
      moveMapInk();
      mNodes.forEach((g, i) => later(() => g.classList.add("swap"), i * 40));
      cap.style.opacity = "0";
      later(() => {
        paintMap(k);
        cap.style.opacity = "1";
        mNodes.forEach((g, i) => later(() => g.classList.remove("swap"), i * 70));
      }, 320);
      if (user) {
        trackEvent("structure_map_tab", { structure: k });
        clearInterval(mapTimer);
      }
    };
    paintMap("family");
    moveMapInk();
    on(window, "resize", moveMapInk);
    fontsReady(moveMapInk);
    segB.forEach((b) => on(b, "click", () => setMap(b.dataset.s || "family", true)));
    if (!reduced) {
      const order = ["family", "property", "business"];
      let oi = 0;
      mapTimer = every(() => {
        oi = (oi + 1) % 3;
        setMap(order[oi], false);
      }, 6000);
    }

    /* small screens: re-lay the map so labels stay readable */
    {
      const svg = $<SVGSVGElement>("#mapSvg");
      const L = { big: [[180, 200], [170, 220], [180, 200]], leaf: [30, 210, 390], lw: 140 };
      const S = { big: [[130, 300], [120, 320], [130, 300]], leaf: [0, 194, 388], lw: 172 };
      const w3 = $<SVGPathElement>("#w3");
      const w5 = $<SVGPathElement>("#w5");
      const hi = $$<SVGPathElement>("#mapSvg .wire-hi");
      const lay = () => {
        const sm = innerWidth < 720;
        const c = sm ? S : L;
        svg.classList.toggle("sm", sm);
        mNodes.forEach((g, i) => {
          const r = $<SVGRectElement>("rect", g);
          const t = $$<SVGTextElement>("text", g);
          if (i < 3) {
            r.setAttribute("x", String(c.big[i][0]));
            r.setAttribute("width", String(c.big[i][1]));
            t[0].setAttribute("y", String(+(r.getAttribute("y") || 0) + (sm ? 27 : 26)));
            t[1].setAttribute("y", String(+(r.getAttribute("y") || 0) + (sm ? 47 : 44)));
          } else {
            g.classList.add("lf");
            const x = c.leaf[i - 3];
            r.setAttribute("x", String(x));
            r.setAttribute("width", String(c.lw));
            t.forEach((e) => e.setAttribute("x", String(x + c.lw / 2)));
            t[0].setAttribute("y", String(348 + (sm ? 27 : 26)));
            t[1].setAttribute("y", String(348 + (sm ? 46 : 44)));
          }
        });
        const a = c.leaf[0] + c.lw / 2;
        const b = c.leaf[2] + c.lw / 2;
        const d3 = `M280 306 C280 330 ${a} 322 ${a} 348`;
        const d5 = `M280 306 C280 330 ${b} 322 ${b} 348`;
        w3.setAttribute("d", d3);
        w5.setAttribute("d", d5);
        hi[2].setAttribute("d", d3);
        hi[4].setAttribute("d", d5);
      };
      lay();
      on(window, "resize", lay);
    }

    /* stamps: marquee with a scroll boost, paused on hover */
    if (!reduced) {
      const rows = $$(".stamps .st-row").map((r) => {
        const t = $(".st-t", r);
        t.classList.add("js");
        return { el: t, dir: +(r.dataset.dir || 1), x: 0, w: 0, hover: false, row: r };
      });
      const measure = () =>
        rows.forEach((o) => {
          o.w = o.el.scrollWidth / 2;
          if (o.dir > 0 && !o.x) o.x = -o.w;
        });
      measure();
      on(window, "resize", measure);
      fontsReady(measure);
      rows.forEach((o) => {
        on(o.row, "mouseenter", () => (o.hover = true));
        on(o.row, "mouseleave", () => (o.hover = false));
      });
      let boost = 0;
      let ly = scrollY;
      let last = performance.now();
      const sp = [0, 0];
      on(window, "scroll", () => {
        const d = scrollY - ly;
        ly = scrollY;
        boost = Math.max(-14, Math.min(14, boost + d * 0.06));
      }, { passive: true });
      let visible = true;
      observe((es) => (visible = es[0].isIntersecting)).observe($(".stamps"));
      const f = (t: number) => {
        if (!alive) return;
        const dt = Math.min(50, t - last);
        last = t;
        boost *= 0.92;
        if (visible)
          rows.forEach((o, i) => {
            const target = o.hover ? 0 : 0.045 + Math.abs(boost) * 0.02;
            sp[i] += (target - sp[i]) * 0.08;
            o.x += o.dir * sp[i] * dt;
            if (o.x <= -o.w) o.x += o.w;
            if (o.x > 0) o.x -= o.w;
            o.el.style.transform = `translate3d(${o.x.toFixed(2)}px,0,0)`;
          });
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }

    /* compare slider, with a teaser sweep the first time it is seen */
    {
      const sl = $("#slider");
      const slR = $<HTMLInputElement>("#slR");
      let touched = false;
      const setX = (v: number) => sl.style.setProperty("--x", v + "%");
      on(slR, "input", () => {
        setX(+slR.value);
        if (!touched) {
          touched = true;
          trackEvent("compare_slider");
        }
      });
      const sIO = observe(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting || reduced) return;
            sIO.disconnect();
            const t0 = performance.now();
            const a = (t: number) => {
              if (touched || !alive) return;
              const p = Math.min(1, (t - t0) / 1800);
              const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
              setX(v);
              slR.value = String(v);
              if (p < 1) requestAnimationFrame(a);
            };
            requestAnimationFrame(a);
          }),
        { threshold: 0.5 },
      );
      sIO.observe(sl);
    }

    /* layers: scroll-driven tower */
    const twPin = $("#twPin");
    const tw = $<SVGSVGElement>("#tw");
    const pls = $$<SVGGElement>("#tw .pl");
    const twCards = $$("#twCards .tw-c");
    const twNav = $$<HTMLButtonElement>("#twNav button");
    const twNum = $("#twNum");
    const twBar = $("#twBar");
    const twGlow = $("#twGlow");
    const GLOW = ["#14253e1f", "#cc866759", "#2a446859", "#cc866740"];
    let curL = -1;
    const layers = () => {
      const r = twPin.getBoundingClientRect();
      const total = twPin.offsetHeight - innerHeight;
      const pr = Math.min(1, Math.max(0, -r.top / total));
      let p = pr * 4;
      if (reduced) p = 4;
      // Each layer drops in once as a whole step (the CSS transition animates it), instead of being moved on
      // every scroll frame: the layers carry SVG shadows and glows, so per-frame moves repainted the diagram.
      pls.forEach((g, i) => {
        const shown = i === 0 || p > i - 0.05;
        if (g.dataset.shown === String(shown)) return;
        g.dataset.shown = String(shown);
        g.style.opacity = shown ? "1" : "0";
        ($(".mv", g) as unknown as SVGGElement).style.transform = shown ? "translateY(0)" : "translateY(-90px)";
        g.classList.toggle("in", shown);
      });
      twBar.style.width = pr * 100 + "%";
      const act = Math.min(3, Math.floor(p));
      tw.classList.toggle("flowing", p > 1.2);
      if (act === curL) return;
      const prev = curL;
      curL = act;
      pls.forEach((g, i) => g.classList.toggle("act", i === act));
      twCards.forEach((c, i) => {
        c.classList.toggle("on", i === act);
        c.classList.toggle("up", i < act);
      });
      twNav.forEach((b, i) => b.classList.toggle("on", i === act));
      twNum.textContent = "0" + (act + 1);
      twGlow.style.background = `radial-gradient(circle,${GLOW[act]},transparent 65%)`;
      twGlow.style.top = 62 - act * 9 + "%";
      if (prev >= 0) trackEvent("layer_view", { layer: act + 1 });
    };
    twNav.forEach((b, i) =>
      on(b, "click", () => {
        const total = twPin.offsetHeight - innerHeight;
        scrollTo({ top: twPin.getBoundingClientRect().top + scrollY + total * ((i + 0.5) / 4), behavior: "smooth" });
      }),
    );

    /* Tower steps: inside the tower, one scroll gesture (wheel/trackpad flick, swipe, arrow/page/space key)
       moves exactly one layer, so all four are seen in order, down and up. Past layer 4 (or above layer 1)
       the page scrolls normally. A fast fling that would skip the tower stops at its first (or last) layer. */
    const towerStops = () => {
      const pinTop = twPin.getBoundingClientRect().top + scrollY;
      const total = twPin.offsetHeight - innerHeight;
      return [0, 1, 2, 3].map((i) => Math.round(pinTop + (total * (i + 0.5)) / 4));
    };
    // The next stop in that direction, or null when outside the tower or leaving it.
    const towerTarget = (dir: number) => {
      const s = towerStops();
      const y = scrollY;
      if (y < s[0] - innerHeight * 0.5 || y > s[3] + innerHeight * 0.5) return null;
      return dir > 0 ? (s.find((v) => v > y + 4) ?? null) : ([...s].reverse().find((v) => v < y - 4) ?? null);
    };
    let gliding = false;
    let glideTimer = 0;
    let jumpUntil = 0; // anchor links and the layer dots may pass over the tower
    const glide = (y: number) => {
      gliding = true;
      scrollTo({ top: y, behavior: "smooth" });
      clearTimeout(glideTimer);
      glideTimer = window.setTimeout(() => (gliding = false), 750);
      timers.push(glideTimer);
    };
    if (!reduced) {
      let lastWheel = 0;
      let wheelHandled = false;
      on(window, "wheel", (e: WheelEvent) => {
        if (e.ctrlKey) return; // pinch-zoom
        const now = performance.now();
        // A flick (and a trackpad's momentum after it) is one gesture: events less than 300ms apart.
        if (now - lastWheel > 300) wheelHandled = false;
        lastWheel = now;
        if (gliding || wheelHandled) {
          if (towerTarget(1) !== null || towerTarget(-1) !== null) e.preventDefault();
          return;
        }
        const target = towerTarget(Math.sign(e.deltaY));
        if (target === null) return;
        e.preventDefault();
        wheelHandled = true;
        glide(target);
      }, { passive: false });

      let touchY = 0;
      let touchLive = false;
      let touchHandled = false;
      on(document, "touchstart", (e: TouchEvent) => {
        touchY = e.touches[0].clientY;
        touchHandled = false;
        touchLive = towerTarget(1) !== null || towerTarget(-1) !== null;
      }, { passive: true });
      on(document, "touchmove", (e: TouchEvent) => {
        if (!touchLive) return;
        const dy = touchY - e.touches[0].clientY; // finger up = scroll down
        if (gliding || touchHandled) {
          e.preventDefault();
          return;
        }
        const target = towerTarget(Math.sign(dy));
        if (target === null) {
          touchLive = false; // leaving the tower: native scrolling
          return;
        }
        e.preventDefault();
        if (Math.abs(dy) > 24) {
          touchHandled = true;
          glide(target);
        }
      }, { passive: false });

      on(window, "keydown", (e: KeyboardEvent) => {
        if (/input|select|textarea/i.test((e.target as Element).tagName)) return;
        const dir = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, " ": e.shiftKey ? -1 : 1 }[e.key];
        if (!dir) return;
        if (gliding) {
          if (towerTarget(dir) !== null) e.preventDefault();
          return;
        }
        const target = towerTarget(dir);
        if (target === null) return;
        e.preventDefault();
        glide(target);
      });

      on(page, "click", (e: MouseEvent) => {
        if ((e.target as Element).closest('a[href^="#"], #twNav button')) jumpUntil = performance.now() + 2000;
      }, { capture: true });
    }
    // A fling that crosses into the tower stops on its first layer (or, going up, its last).
    let towerLastY = scrollY;
    const towerGuard = () => {
      const y = scrollY;
      // Only real scrolling (under a screen per frame); big jumps such as scroll restore after a reload,
      // the Home/End keys or anchor links are left alone.
      if (!reduced && !gliding && performance.now() > jumpUntil && Math.abs(y - towerLastY) < innerHeight) {
        const s = towerStops();
        if (towerLastY < s[0] - 4 && y > s[0] + 4) scrollTo({ top: s[0], behavior: "instant" as ScrollBehavior });
        else if (towerLastY > s[3] + 4 && y < s[3] - 4) scrollTo({ top: s[3], behavior: "instant" as ScrollBehavior });
      }
      towerLastY = scrollY;
    };

    /* header hide on scroll down, mobile dock */
    const top = $("#top");
    const dock = $("#dock");
    const heroEl = $("#hero");
    let lastY = 0;
    const onScroll = () => {
      towerGuard();
      const y = scrollY;
      top.classList.toggle("scrolled", y > 20);
      top.classList.toggle("hide", y > 500 && y > lastY + 4);
      if (y < lastY - 4) top.classList.remove("hide");
      lastY = y;
      const hr = heroEl.getBoundingClientRect();
      const fm = page.querySelector("#fm")?.getBoundingClientRect();
      // The bar stays out of the way while the layer tower is pinned on screen, and returns after it.
      const tp = twPin.getBoundingClientRect();
      const inTower = tp.top < innerHeight && tp.bottom > 0;
      dock.classList.toggle("show", hr.bottom < 0 && !inTower && !(fm && fm.top < innerHeight && fm.bottom > 0));
      if (y > 40) closeDrawer();
      layers();
    };
    // At most once per frame, however many scroll events the browser sends.
    let scrollQueued = false;
    on(window, "scroll", () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        if (alive) onScroll();
      });
    }, { passive: true });

    /* pillar rows */
    $$(".row button").forEach((b) =>
      on(b, "click", () => {
        const r = b.parentElement as HTMLElement;
        const open = !r.classList.contains("open");
        $$(".row").forEach((x) => {
          x.classList.remove("open");
          $("button", x).setAttribute("aria-expanded", "false");
        });
        if (open) {
          r.classList.add("open");
          b.setAttribute("aria-expanded", "true");
        }
      }),
    );

    /* compare: expanding panels */
    {
      const xp = $("#xp");
      const xps = $$("#xp .xp-p");
      let xpI = 0;
      let xpT = 0;
      let xpUser = false;
      let xpSeen = false;
      let xpHover = 0;
      const xpSet = (i: number, user: boolean) => {
        if (i === xpI && xps[i].classList.contains("on")) return;
        xpI = i;
        xps.forEach((p, j) => {
          p.classList.toggle("on", j === i);
          p.setAttribute("aria-expanded", j === i ? "true" : "false");
          const bar = $(".xp-bar i", p);
          if (bar) {
            bar.style.animation = "none";
            void bar.offsetWidth;
            bar.style.animation = "";
          }
        });
        if (user) {
          xpUser = true;
          xp.classList.remove("auto");
          clearInterval(xpT);
          trackEvent("compare_panel", { structure: xps[i].dataset.k });
          if (innerWidth < 720)
            later(() => {
              const r = xps[i].getBoundingClientRect();
              if (r.top < 70) scrollBy({ top: r.top - 80, behavior: "smooth" });
            }, 80);
        }
      };
      xps.forEach((p, i) => {
        on(p, "click", (e: MouseEvent) => {
          if ((e.target as Element).closest(".xp-cta")) return;
          xpSet(i, true);
        });
        on(p, "keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            xpSet(i, true);
          }
        });
        if (fine) {
          on(p, "mouseenter", () => {
            clearTimeout(xpHover);
            xpHover = window.setTimeout(() => xpSet(i, true), 140);
            timers.push(xpHover);
          });
          on(p, "mouseleave", () => clearTimeout(xpHover));
        }
      });
      if (!reduced)
        observe(
          (es) =>
            es.forEach((e) => {
              if (e.isIntersecting && !xpUser && !xpSeen) {
                xpSeen = true;
                xp.classList.add("auto");
                xpT = every(() => {
                  if (!xpUser) xpSet((xpI + 1) % xps.length, false);
                }, 7000);
              }
            }),
          { threshold: 0.45 },
        ).observe(xp);
    }

    /* fit finder: three questions, rendered into #ffCard */
    {
      const ff = $("#ffCard");
      const fxLi = $$("#fxSteps li");
      const fxSteps = $("#fxSteps");
      let fa: string[] = [];
      let started = false;
      let busy = false;
      const svg = (p: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[p]}</svg>`;
      const label = (i: number, v: string) => FQ[i].o.find((x) => x[0] === v)?.[1] ?? "";
      const side = () => {
        const n = fa.length;
        fxLi.forEach((li, i) => {
          li.classList.toggle("done", i < n);
          li.classList.toggle("cur", i === n && n < 3);
          $("em", li).textContent = i < n ? label(i, fa[i]) : i === n ? "Answering now" : "Waiting for your answer";
        });
        fxSteps.style.setProperty("--fp", String(Math.min(1, n / 2)));
      };
      const head = (i: number) =>
        `<div class="fx-top"><div class="fx-count"><b>0${Math.min(i + 1, 3)}</b><span>/ 03</span></div><div class="fx-prog">${[0, 1, 2]
          .map((k) => `<i class="${k < i ? "on" : k === i ? "cur" : ""}"></i>`)
          .join("")}</div><button class="fx-back" type="button" ${i ? "" : "hidden"}>&larr; Back</button></div>`;
      const live = () => {
        const p = fxPlan(fa);
        return `<div class="fx-live"><small>Your structure so far</small><div class="fx-chips">${
          p.st.length ? p.st.map((k, i) => (i ? '<b class="plus">+</b>' : "") + `<span><i></i>${NAMES[k]}</span>`).join("") : "<em>Builds as you answer</em>"
        }</div></div>`;
      };
      const renderQ = (dir?: "back") => {
        const i = fa.length;
        const q = FQ[i];
        ff.innerHTML =
          head(i) +
          `<div class="fx-stage"><div class="fx-q${dir === "back" ? " back" : ""}"><h3>${q.q}</h3><p class="fx-sub">Choose one${fine ? ", or press 1 to " + q.o.length : ""}.</p><div class="fx-opts${q.o.length === 3 ? " n3" : ""}">` +
          q.o
            .map(
              (o, k) =>
                `<button type="button" class="fx-o" data-v="${o[0]}" style="animation-delay:${0.08 + k * 0.06}s"><span class="fx-ic">${svg(o[0])}</span><span class="fx-t"><b>${o[1]}</b><small>${o[2]}</small></span><span class="fx-k">${k + 1}</span></button>`,
            )
            .join("") +
          "</div></div></div>" +
          live();
        side();
        busy = false;
        $$<HTMLButtonElement>(".fx-o", ff).forEach((b) => {
          on(b, "click", () => pick(b));
          if (fine)
            on(b, "pointermove", (e: PointerEvent) => {
              const r = b.getBoundingClientRect();
              b.style.setProperty("--mx", e.clientX - r.left + "px");
              b.style.setProperty("--my", e.clientY - r.top + "px");
            });
        });
        const back = $(".fx-back", ff);
        if (back)
          on(back, "click", () => {
            fa.pop();
            renderQ("back");
          });
      };
      const result = () => {
        const [g, w, c] = fa;
        const p = fxPlan(fa);
        const lvl = ["Top level", "Below it", "For overseas assets"];
        const names = p.st.map((k) => NAMES[k]).join(" + ");
        const wa = `${SITE.whatsapp}?text=${encodeURIComponent(`Hello, I used your Find your fit tool. Suggested: ${names}. I would like to discuss it with an advisor.`)}`;
        ff.innerHTML =
          head(3) +
          `<div class="fx-stage"><div class="fx-res"><span class="fx-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>Usually discussed first</span><h3>${names}</h3><p>${p.why}</p>` +
          `<div class="fx-stack">${p.st.map((k, i) => `<div class="fx-l"><i>${i + 1}</i><b>${NAMES[k]}</b><small>${k === "offshore" ? lvl[2] : i ? lvl[1] : lvl[0]}</small></div>`).join("")}</div>` +
          `<div class="fx-acts"><a class="btn btn-cu" href="#consult" data-cta-location="SPV Fit Finder Book" id="ffBook">Discuss this with an advisor</a><a class="fx-wa" href="${wa}" target="_blank" rel="noopener" data-area="SPV Fit Finder"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>Send to WhatsApp</a><button class="fx-again" id="ffAgain" type="button">Try again</button></div></div></div>`;
        $$(".fx-prog i", ff).forEach((i) => (i.className = "on"));
        const bk = $(".fx-back", ff);
        bk.hidden = false;
        on(bk, "click", () => {
          fa.pop();
          renderQ("back");
        });
        side();
        fxSteps.style.setProperty("--fp", "1");
        on($("#ffBook", ff), "click", () => prefill({ goal: GOAL_OF[g], assets: ASSETS_OF[w], fit: names }));
        on($("#ffAgain", ff), "click", () => {
          fa = [];
          renderQ("back");
        });
        prefill({ fit: names });
        trackEvent("fit_finder_complete", { goal: g, assets: w, control: c, suggestion: p.st.join("+") });
        busy = false;
      };
      const pick = (b: HTMLButtonElement) => {
        if (busy) return;
        busy = true;
        if (!started) {
          started = true;
          trackEvent("fit_finder_start");
        }
        b.classList.add("pick");
        fa.push(b.dataset.v || "");
        const lv = $(".fx-live", ff);
        if (lv) lv.outerHTML = live();
        side();
        later(() => $(".fx-q", ff)?.classList.add("out"), reduced ? 0 : 260);
        later(() => {
          if (fa.length < 3) renderQ();
          else result();
          if (innerWidth < 720) {
            const r = ff.getBoundingClientRect();
            if (r.top < 60 || r.top > innerHeight * 0.4) scrollBy({ top: r.top - 84, behavior: "smooth" });
          }
        }, reduced ? 0 : 560);
      };
      fxLi.forEach((li, i) =>
        on(li, "click", () => {
          if (i < fa.length && !busy) {
            fa = fa.slice(0, i);
            renderQ("back");
          }
        }),
      );
      on(window, "keydown", (e: KeyboardEvent) => {
        if (fa.length >= 3 || /input|select|textarea/i.test((e.target as Element).tagName)) return;
        const r = ff.getBoundingClientRect();
        if (r.top > innerHeight * 0.7 || r.bottom < innerHeight * 0.3) return;
        const k = parseInt(e.key, 10);
        const bs = $$<HTMLButtonElement>(".fx-o", ff);
        if (k >= 1 && k <= bs.length) pick(bs[k - 1]);
      });
      renderQ();
    }

    /* "Plan a …" links pre-fill the consultation form */
    on(page, "click", (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLElement>("[data-goal]");
      if (!a) return;
      const g = a.dataset.goal || "";
      prefill({ goal: GOAL_OF[g], ...(g === "off" ? { assets: "Outside the UAE" as SpvAssets } : {}) });
    });

    /* persona tilt, magnetic primary buttons */
    if (fine && !reduced) {
      $$(".tilt").forEach((c) => {
        on(c, "pointermove", (e: PointerEvent) => {
          const r = c.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
        });
        on(c, "pointerleave", () => (c.style.transform = ""));
      });
      $$(".btn-cu").forEach((b) => {
        on(b, "pointermove", (e: PointerEvent) => {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.12}px,${(e.clientY - r.top - r.height / 2) * 0.2}px)`;
        });
        on(b, "pointerleave", () => (b.style.transform = ""));
      });
    }

    /* scroll progress and the process path */
    const sprog = $("#sprog");
    const jr = $("#jr");
    const jrBase = $<SVGPathElement>("#jrBase");
    const jrFill = $<SVGPathElement>("#jrFill");
    const jrOrb = $("#jrOrb");
    const jrNodes = $$("#jr .jr-node");
    const jrCards = $$("#jr .jr-c");
    const jrRing = $<SVGCircleElement>("#jrRing");
    const jrNum = $("#jrNum");
    const jrName = $("#jrName");
    const jrPin = $("#jrPin");
    const jrSec = $("#process");
    const JRN = ["Consultation", "Structure map", "Compare options", "Implement and maintain"];
    let jrLen = 0;
    let jrAt: number[] = [];
    let jrCur = -1;
    const journey = () => {
      if (!jrLen) return;
      const r = jr.getBoundingClientRect();
      const vert = innerWidth <= 1100;
      let p: number;
      if (jrSec.classList.contains("pinned")) {
        const pr = jrPin.getBoundingClientRect();
        p = (-pr.top / (jrPin.offsetHeight - innerHeight)) * 1.1 - 0.03;
      } else p = vert ? (innerHeight * 0.6 - r.top) / r.height : (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.15);
      if (reduced) p = 1;
      p = Math.min(1, Math.max(0, p));
      const len = p * jrLen;
      jrFill.style.strokeDashoffset = String(jrLen - len);
      const pt = jrFill.getPointAtLength(Math.max(0.1, len));
      jrOrb.style.transform = `translate(${pt.x}px,${pt.y}px)`;
      jrOrb.classList.toggle("on", p > 0.005 && p < 0.995);
      let n = 0;
      jrAt.forEach((a, i) => {
        if (len >= a - 2) n = i + 1;
      });
      jrNodes.forEach((el, i) => el.classList.toggle("on", i < n));
      jrCards.forEach((el, i) => {
        el.classList.toggle("on", i < n);
        el.classList.toggle("cur", i === n - 1);
      });
      jrRing.style.strokeDashoffset = String(176 * (1 - n / 4));
      const c = Math.max(0, n - 1);
      if (c !== jrCur) {
        jrCur = c;
        jrNum.textContent = "0" + (c + 1);
        jrName.textContent = JRN[c];
        if (n) trackEvent("process_step_view", { step: c + 1 });
      }
    };
    const jrLayout = () => {
      jrSec.classList.toggle("pinned", innerWidth > 1100 && innerHeight >= 700 && !reduced);
      const jb = jr.getBoundingClientRect();
      const vert = innerWidth <= 1100;
      const pts: number[][] = jrCards.map((c) => {
        const r = c.getBoundingClientRect();
        return vert ? [innerWidth <= 720 ? 29 : 42, r.top - jb.top + 34] : [r.left - jb.left + r.width / 2, 60];
      });
      let d: string;
      if (vert) {
        const x = pts[0][0];
        d = `M${x} 0 L${x} ${jr.offsetHeight - 10}`;
      } else {
        const W = jr.offsetWidth;
        const ys = [72, 40, 76, 44];
        pts.forEach((p, i) => (p[1] = ys[i]));
        d = `M0 58 C${pts[0][0] / 2} 58 ${pts[0][0] / 2} ${pts[0][1]} ${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          const mx = (a[0] + b[0]) / 2;
          d += ` C${mx} ${a[1]} ${mx} ${b[1]} ${b[0]} ${b[1]}`;
        }
        d += ` C${(pts[3][0] + W) / 2} ${pts[3][1]} ${(pts[3][0] + W) / 2} 58 ${W} 58`;
      }
      jrBase.setAttribute("d", d);
      jrFill.setAttribute("d", d);
      jrLen = jrFill.getTotalLength();
      jrFill.style.strokeDasharray = String(jrLen);
      jrNodes.forEach((n, i) => {
        n.style.left = pts[i][0] + "px";
        n.style.top = pts[i][1] + "px";
      });
      // Length along the path at each node.
      jrAt = pts.map((p) => {
        let best = 0;
        let bd = 1e9;
        for (let l = 0; l <= jrLen; l += 4) {
          const q = jrFill.getPointAtLength(l);
          const dd = Math.abs(q.x - p[0]) + Math.abs(q.y - p[1]);
          if (dd < bd) {
            bd = dd;
            best = l;
          }
        }
        return best;
      });
      journey();
    };
    on(window, "resize", jrLayout);
    fontsReady(jrLayout);
    later(jrLayout, 300);
    const motionScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      sprog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      journey();
    };
    let motionQueued = false;
    on(window, "scroll", () => {
      if (motionQueued) return;
      motionQueued = true;
      requestAnimationFrame(() => {
        motionQueued = false;
        if (alive) motionScroll();
      });
    }, { passive: true });
    on(window, "resize", motionScroll);
    motionScroll();

    /* section headings rise word by word */
    $$(".sec h2, .tower h2").forEach((h) => {
      if (h.closest(".hero")) return;
      // Split once, but always set up the reveal: in development React runs this effect twice, and a
      // heading split on the first run would otherwise never get .go and stay invisible.
      if (h.dataset.split) {
        if (reduced) h.classList.add("go");
        else {
          const again = observe(
            (es) =>
              es.forEach((e) => {
                if (e.isIntersecting) {
                  h.classList.add("go");
                  again.disconnect();
                }
              }),
            { threshold: 0, rootMargin: "0px 0px 20% 0px" },
          );
          again.observe(h);
        }
        return;
      }
      h.dataset.split = "1";
      const wrap = (node: Node) => {
        Array.from(node.childNodes).forEach((n) => {
          if (n.nodeType === 3) {
            const f = document.createDocumentFragment();
            (n.textContent || "").split(/(\s+)/).forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(" "));
              else {
                const w = document.createElement("span");
                w.className = "hw";
                const i = document.createElement("span");
                i.textContent = p;
                w.appendChild(i);
                f.appendChild(w);
              }
            });
            n.parentNode?.replaceChild(f, n);
          } else if (n.nodeType === 1 && (n as Element).tagName !== "BR") {
            const el = n as HTMLElement;
            if (el.classList.contains("cu") || el.classList.contains("gt")) {
              const w = document.createElement("span");
              w.className = "hw";
              el.parentNode?.replaceChild(w, el);
              const i = document.createElement("span");
              i.appendChild(el);
              w.appendChild(i);
            } else wrap(el);
          }
        });
      };
      wrap(h);
      h.classList.add("split");
      $$(".hw>span", h).forEach((sp, i) => (sp.style.transitionDelay = Math.min(i * 25, 250) + "ms"));
      if (reduced) {
        h.classList.add("go");
        return;
      }
      const o = observe(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              h.classList.add("go");
              o.disconnect();
            }
          }),
        { threshold: 0, rootMargin: "0px 0px 20% 0px" },
      );
      o.observe(h);
    });

    /* pointer effects: hero map tilt, aurora drift, spotlights */
    if (fine && !reduced) {
      const mapC = $(".map");
      const heroS = $("#hero");
      const aur = $(".aur");
      on(heroS, "pointermove", (e: PointerEvent) => {
        const r = mapC.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        mapC.style.transform = `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
        aur.style.transform = `translate(${(e.clientX / innerWidth - 0.5) * 30}px,${(e.clientY / innerHeight - 0.5) * 30}px)`;
      });
      on(heroS, "pointerleave", () => (mapC.style.transform = ""));
      $$(".spot").forEach((sec) =>
        on(sec, "pointermove", (e: PointerEvent) => {
          const r = sec.getBoundingClientRect();
          sec.style.setProperty("--sx", e.clientX - r.left + "px");
          sec.style.setProperty("--sy", e.clientY - r.top + "px");
        }),
      );
      $$(".wy,.bt").forEach((c) =>
        on(c, "pointermove", (e: PointerEvent) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty("--mx", e.clientX - r.left + "px");
          c.style.setProperty("--my", e.clientY - r.top + "px");
        }),
      );
    }

    /* trust bento: jurisdiction frame and office toggle */
    {
      const row = $(".ju-row");
      if (row) {
        const sp = $$("span", row);
        const fr = $(".ju-frame", row);
        let k = 0;
        const mv = () => {
          // Exact (fractional) positions, so the frame sits evenly around chips in fractional grid columns.
          const a = sp[k].getBoundingClientRect();
          const r = row.getBoundingClientRect();
          fr.style.left = a.left - r.left - 4 + "px";
          fr.style.width = a.width + 8 + "px";
          sp.forEach((x, i) => x.classList.toggle("on", i === k));
        };
        mv();
        on(window, "resize", mv);
        fontsReady(mv);
        if (!reduced)
          every(() => {
            k = (k + 1) % sp.length;
            mv();
          }, 1600);
      }
      const seg = $(".of-seg");
      if (seg) {
        const bs = $$("b", seg);
        const ink = $(".ink", seg);
        let k = 0;
        const mv = () => {
          bs.forEach((b, i) => b.classList.toggle("on", i === k));
          ink.style.left = bs[k].offsetLeft + "px";
          ink.style.width = bs[k].offsetWidth + "px";
        };
        mv();
        fontsReady(mv);
        on(window, "resize", mv);
        if (!reduced)
          every(() => {
            k = 1 - k;
            mv();
          }, 2600);
      }
    }

    onScroll();

    return () => {
      alive = false;
      ac.abort();
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  return null;
}
