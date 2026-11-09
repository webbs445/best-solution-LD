import type { Jurisdiction } from "@/lib/pricing";

export const SITE = {
  name: "Best Solution",
  url: "https://www.best-solution.ae",
  phone: { display: "+971 52 233 0011", href: "tel:+971522330011" },
  whatsapp: "https://wa.me/97145531546",
  email: "connect@best-solution.ae",
  // Local copies of the www legal pages, so ad pages never link out to www (app/privacy, app/terms).
  privacy: "/privacy",
  terms: "/terms",
  googleReviews: "https://www.google.com/search?q=Best+Solution+Business+Consultancy+Dubai+reviews",
  ogImage: "https://www.best-solution.ae/og_image.jpg",
  mainPhoto: "/images/main.webp",
  logo: "/brand/wordmark.webp",
  mark: "/brand/wordmark-mark.webp",
  /** Opening hours, shared by the home page and /freezone. */
  hours: { long: "Monday to Friday, 9am to 6pm", short: "Mon to Fri, 9AM to 6PM" },
  /**
   * [reply time]: how soon a consultant calls back, e.g. "one working hour". Empty until sales confirms it; while
   * empty, the callback thank-you keeps its current wording.
   */
  replyTime: "",
  /** Founding year, shared by the home page and /freezone. */
  founded: 2014,
  /** Google rating, shared by /freezone and /services: update here only. */
  rating: { score: 4.8, count: 200 },
};

/*
  PARTNER LOGOS: one flag per zone (free zones and the RAK ICC registry), all false. A zone's logo image renders only
  when its flag is true; otherwise its text badge stays. Set a flag to true only after Best Solution confirms a signed
  agreement that allows logo use. Government department emblems (DET, DED, SEDD, emirate emblems) are never shown and
  have no flag.
*/
export const PARTNER_ZONES = {
  ifza: { zone: "f0", name: "IFZA", logo: "/zones/ifza.webp" },
  meydan: { zone: "f1", name: "Meydan Free Zone", logo: "/zones/meydan.webp" },
  dmcc: { zone: "f2", name: "DMCC", logo: "/zones/dmcc.webp" },
  jafza: { zone: "f3", name: "JAFZA", logo: "/zones/jafza.svg" },
  siliconOasis: { zone: "f4", name: "Dubai Silicon Oasis", logo: "/zones/dubai-silicon-oasis.svg" },
  internetCity: { zone: "f5", name: "Dubai Internet City", logo: "/zones/dubai-internet-city.webp" },
  mediaCity: { zone: "f6", name: "Dubai Media City", logo: "/zones/dubai-media-city.webp" },
  dafza: { zone: "f7", name: "DAFZA", logo: "/zones/dafza.webp" },
  dubaiSouth: { zone: "f8", name: "Dubai South", logo: "/zones/dubai-south.svg" },
  healthcareCity: { zone: "f9", name: "Dubai Healthcare City", logo: "/zones/dubai-healthcare-city.svg" },
  difc: { zone: "f10", name: "DIFC", logo: "/zones/difc.webp" },
  commerCity: { zone: "f11", name: "Dubai CommerCity", logo: "/zones/dubai-commercity.svg" },
  adgm: { zone: "f12", name: "ADGM", logo: "/zones/adgm.svg" },
  kezad: { zone: "f13", name: "KEZAD", logo: "/zones/kezad.webp" },
  masdar: { zone: "f14", name: "Masdar City Free Zone", logo: "/zones/masdar-city.webp" },
  shams: { zone: "f15", name: "SHAMS", logo: "/zones/shams.webp" },
  saif: { zone: "f16", name: "SAIF Zone", logo: "/zones/saif-zone.webp" },
  hamriyah: { zone: "f17", name: "Hamriyah Free Zone", logo: "/zones/hamriyah.webp" },
  spc: { zone: "f18", name: "SPC Free Zone", logo: "/zones/spc.webp" },
  srtip: { zone: "f19", name: "SRTIP", logo: "/zones/srtip.webp" },
  ajmanFz: { zone: "f20", name: "Ajman Free Zone", logo: "/zones/ajman-free-zone.webp" },
  nuVenture: { zone: "f21", name: "Ajman Nu Venture Free Zone", logo: "/zones/ajman-nu-venture.webp" },
  rakez: { zone: "f22", name: "RAKEZ", logo: "/zones/rakez.webp" },
  rakMaritime: { zone: "f23", name: "RAK Maritime City", logo: null },
  innovationCity: { zone: "f24", name: "Innovation City", logo: "/zones/innovation-city.svg" },
  fujairahFz: { zone: "f25", name: "Fujairah Free Zone", logo: "/zones/fujairah-free-zone.webp" },
  creativeCity: { zone: "f26", name: "Creative City Fujairah", logo: "/zones/creative-city-fujairah.webp" },
  uaqFtz: { zone: "f27", name: "Umm Al Quwain FTZ", logo: "/zones/uaq-ftz.webp" },
  rakIcc: { zone: "o0", name: "RAK ICC", logo: "/zones/rak-icc.webp" },
} as const;
export type PartnerKey = keyof typeof PARTNER_ZONES;

export const PARTNER_LOGOS: Record<PartnerKey, boolean> = {
  ifza: false, meydan: false, dmcc: false, jafza: false, siliconOasis: false, internetCity: false, mediaCity: false,
  dafza: false, dubaiSouth: false, healthcareCity: false, difc: false, commerCity: false, adgm: false, kezad: false,
  masdar: false, shams: false, saif: false, hamriyah: false, spc: false, srtip: false, ajmanFz: false, nuVenture: false,
  rakez: false, rakMaritime: false, innovationCity: false, fujairahFz: false, creativeCity: false, uaqFtz: false,
  rakIcc: false,
};

const PARTNER_KEYS = (Object.keys(PARTNER_ZONES) as PartnerKey[]).filter((k) => PARTNER_LOGOS[k]);
/** Partner zones (flag true), in config order. */
export const PARTNERS = PARTNER_KEYS.map((k) => PARTNER_ZONES[k]);
/** The logo to render for a zone or registry id ("f0", "o0"), or null: only when its partner flag is true. */
export function partnerLogo(zoneId: string): string | null {
  return PARTNERS.find((p) => p.zone === zoneId)?.logo ?? null;
}
/** Strip heading while at least one partner flag is true; null keeps each page's own heading. */
export const PARTNER_HEADING = PARTNERS.length ? "Free zones we work with as a registered partner" : null;
const listNames = (n: string[]) => (n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);

/*
  [CONFIRM] business claims. null = not confirmed, so the claim is not rendered at all (left out of the HTML at build
  time, not hidden with CSS). Fill a value only once Best Solution confirms it with evidence; never count up from zero.
*/
export const CLAIMS: {
  /** e.g. "Advising since 2014" */
  since: string | null;
  /** e.g. "Rated 4.8 from more than 200 Google reviews" (must match the live Google Business Profile) */
  rating: string | null;
  /** e.g. "5,000+ businesses advised" */
  businesses: string | null;
  /** e.g. "Clients from 80+ countries" */
  countries: string | null;
  /** e.g. "50+ in-house professionals" */
  team: string | null;
  /** e.g. "Emirati-owned" */
  ownership: string | null;
  /** Number of free zones we compare, e.g. "28" (shown in stat tiles and headings only once confirmed) */
  zones: string | null;
  /** Number of emirates covered, e.g. "7" */
  emirates: string | null;
  /** Complete accounting package saving, e.g. "Save about 20%" */
  packageSaving: string | null;
  /** /accounting quote heading, e.g. "Your monthly quote, in writing." */
  writtenQuote: string | null;
  /**
   * Fees confirmed in writing before work begins, e.g. "Fees confirmed in writing". Switches on every fees-in-writing
   * line (hero, cards, closing bands, footers).
   */
  writtenFees: string | null;
  /** One named advisor per client, e.g. "One advisor". Switches on every "one advisor" / "dedicated consultant" line. */
  oneAdvisor: string | null;
  /** In-house specialists, e.g. "In-house specialists under one roof". Switches on the in-house expertise lines. */
  inHouse: string | null;
  /** Registered channel partner sentence: set from PARTNER_LOGOS (null while every flag is false). */
  partners: string | null;
} = {
  since: null,
  rating: null,
  businesses: null,
  countries: null,
  team: null,
  ownership: null,
  zones: null,
  emirates: null,
  packageSaving: null,
  writtenQuote: null,
  writtenFees: null,
  oneAdvisor: null,
  inHouse: null,
  partners: PARTNERS.length
    ? `We are a registered channel partner of ${listNames(PARTNERS.map((p) => p.name))}. Free zone names and logos identify the zones we work with.`
    : null,
};

/** The confirmed wording while a CLAIMS key is set, the neutral wording in the same place until then. */
export const claimText = (key: keyof typeof CLAIMS, confirmed: string, neutral: string) => (CLAIMS[key] ? confirmed : neutral);

/** Shown under every hero and in every footer (Google Ads: "Clearly disclose that you are a private entity"). */
export const DISCLAIMER =
  "Best Solution is a private business consultancy. We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities." +
  (CLAIMS.partners ? ` ${CLAIMS.partners}` : "");

/** The second footer note on free zone pages: drops "do not imply any affiliation" once partners are confirmed. */
export const ZONE_NAMES_NOTE = CLAIMS.partners ? "" : "Free zone names identify the zones we advise on and do not imply any affiliation.";

/** Footer blurb tail: "One advisor, with any fees confirmed in writing." only as far as those claims are confirmed. */
export const FOOTER_TAIL = CLAIMS.oneAdvisor && CLAIMS.writtenFees
  ? " One advisor, with any fees confirmed in writing."
  : CLAIMS.oneAdvisor
    ? " One advisor."
    : CLAIMS.writtenFees
      ? " Any fees are confirmed in writing."
      : "";

/*
  Stat tiles: a confirmed claim fills the number slot; until then the slot shows plain, true text in the same style
  (no numbers, no claims). Filling a CLAIMS value switches the tile over automatically.
*/
export const STAT_TEXT = {
  office: { value: "Business Bay", label: "Our office" },
  meet: { value: "In person or video", label: "How we meet" },
  explain: { value: "Plain advice", label: "How we explain" },
  support: { value: "Bookkeeping to tax", label: "Ongoing support" },
} as const;
/** The leading figure of a confirmed claim ("5,000+ businesses advised" -> "5,000+"), or the whole claim. */
export const claimFigure = (claim: string, re = /\d[\d,.]*\+?/) => claim.match(re)?.[0] ?? claim;
export function statTile(claim: string | null, claimLabel: string, fallback: keyof typeof STAT_TEXT, re?: RegExp): { value: string; label: string } {
  return claim ? { value: claimFigure(claim, re), label: claimLabel } : STAT_TEXT[fallback];
}

/** "28 free zones" once the count is confirmed (CLAIMS.zones); plain "free zones" / "Free zones" until then. */
export const zonesPhrase = (cap = false) => (CLAIMS.zones ? `${CLAIMS.zones} free zones` : cap ? "Free zones" : "free zones");

/* Free zone and authority logos shown in the "jurisdictions we advise on" marquee. */
export const AUTHORITIES = [
  { name: "DIFC", file: "difc" },
  { name: "DMCC", file: "dmcc" },
  { name: "IFZA", file: "ifza" },
  { name: "Meydan Free Zone", file: "meydan-free-zone" },
  { name: "Dubai World Trade Centre", file: "dubai-world-trade-centre" },
  { name: "Dubai Airport Free Zone", file: "dubai-airport-free-zone" },
  { name: "SHAMS", file: "shams" },
  { name: "SPC Free Zone", file: "spc-free-zone" },
  { name: "RAKEZ", file: "rakez" },
  { name: "Hamriyah Free Zone", file: "hamriyah-free-zone" },
  { name: "Ajman Free Zone", file: "ajman-free-zone" },
  { name: "Umm Al Quwain FTZ", file: "uaq-free-trade-zone" },
  { name: "SRTIP", file: "srtip" },
].map((a) => ({ ...a, src: `/authorities/${a.file}.webp` }));

export const NAV = [
  { href: "#calculator", label: "Planner" },
  { href: "#consultation", label: "Advice" },
  { href: "#jurisdiction", label: "Compare" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export const SOCIAL = {
  facebook: "https://www.facebook.com/bestsolutionHQ",
  instagram: "https://www.instagram.com/bestsolutionhq/",
  linkedin: "https://www.linkedin.com/company/bestsolutionhq/",
};

export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Best+Solution+Business+Setup+Consultancy+Business+Bay+Dubai";

/** Footer columns. Items without an href are shown as plain text, as on the source page. */
export const FOOTER_COLUMNS: { title: string; links: { label: string; href?: string; external?: boolean }[] }[] = [
  { title: "This page", links: NAV.map((n) => ({ label: n.label, href: n.href })) },
  {
    title: "Services",
    links: [
      { label: "All services", href: "/services" },
      { label: "Free zone", href: "/freezone" },
      { label: "Mainland", href: "/mainland" },
      { label: "Offshore", href: "/offshore" },
      { label: "Plan your budget", href: "/cost-calculator" },
      { label: "SPV", href: "/spv" },
      { label: "Corporate tax", href: "/corporate-tax" },
      { label: "Accounting", href: "/accounting" },
    ],
  },
];

export const TRUST = [
  { count: 5000, suffix: "+", label: "Businesses advised" },
  { count: 80, suffix: "+", label: "Client countries" },
  { count: 200, suffix: "+", label: "Google reviews" },
];

/* Neutral cards that stand in for an unconfirmed claim card, in the same place and style. */
const WHY_NEUTRAL = {
  plain: { title: "Advice in plain terms", body: "We explain your options clearly, so you can compare them and decide." },
  meet: { title: "In person or by video call", body: "Meet us at our office in Business Bay, Dubai, or talk it through online." },
  office: { title: "Based in Business Bay", body: "Our advisors work from our office in Business Bay, Dubai." },
  noObligation: { title: "No obligation", body: "A consultation does not commit you to anything." },
};

/* Used by /services (first three) and /freezone. Claim cards show only once their CLAIMS key is confirmed. */
export const WHY = [
  CLAIMS.oneAdvisor ? { title: "A dedicated consultant", body: "Your advisor remains your single point of contact throughout." } : WHY_NEUTRAL.plain,
  CLAIMS.writtenFees ? { title: "Fees in writing", body: "Fees are confirmed in writing before you proceed." } : WHY_NEUTRAL.meet,
  CLAIMS.inHouse ? { title: "In-house expertise", body: "Specialists across company structuring, taxation, accounting and compliance, under one roof." } : WHY_NEUTRAL.office,
  CLAIMS.ownership ? { title: "Emirati-owned", body: "Founded by Essa Al Harthi and based in Business Bay, Dubai." } : WHY_NEUTRAL.noObligation,
  { title: "Continued support", body: "Tax, accounting and compliance guidance as your business grows." },
];

/** Home page jurisdiction tabs: a plain-language comparison, no prices. */
export interface JurisdictionCopy {
  title: string;
  best: string;
  suited: string;
  market: string;
  owner: string;
  office: string;
  tax: string;
  think: string;
  photo: string;
  photoPosition: string;
}

export const JURIS: Record<Jurisdiction, JurisdictionCopy> = {
  mainland: {
    title: "Mainland",
    best: "Often suits businesses that trade directly across the UAE",
    suited: "Often suits businesses that sell to customers anywhere in the UAE.",
    market: "Across all emirates",
    owner: "Foreign ownership is often possible, depending on the activity",
    office: "A physical office is usually expected",
    tax: "9% on taxable profit above AED 375,000",
    think: "Your activity, where your customers are and the office space you need",
    photo: "/images/main.webp",
    photoPosition: "50% center",
  },
  freezone: {
    title: "Free zone",
    best: "Often suits international and business-to-business work",
    suited: "Often suits international and business-to-business operations.",
    market: "Inside the zone, and international business",
    owner: "Foreign ownership is common, depending on the zone and activity",
    office: "Flexi desk or physical office, depending on the zone",
    tax: "0% on qualifying income and 9% on other income, subject to conditions",
    think: "Which zone fits your activity, and whether you will sell to UAE customers",
    photo: "/images/free-zone-business-park-office.webp",
    photoPosition: "35% center",
  },
  offshore: {
    title: "Offshore",
    best: "Often suits holding and international structures",
    suited: "Often suits holding structures and international business.",
    market: "Outside the UAE",
    owner: "Depends on the structure",
    office: "No office in the UAE in most cases",
    tax: "Depends on the structure and UAE corporate tax rules",
    think: "What the structure needs to hold, and how your bank will view it",
    photo: "/images/why-team.webp",
    photoPosition: "60% center",
  },
};

/* Home page "Why Best Solution" list (WHY above is still used by /freezone and /services). */
export const HOME_WHY = [
  CLAIMS.oneAdvisor ? { title: "A dedicated advisor", body: "One advisor stays your point of contact from the first conversation." } : WHY_NEUTRAL.office,
  { title: "Advice in plain terms", body: "We explain your options clearly, so you can compare them and decide." },
  CLAIMS.inHouse ? { title: "In-house expertise", body: "Specialists in company structure, tax, accounting and compliance, under one roof." } : WHY_NEUTRAL.noObligation,
  { title: "In person or by video call", body: "Meet us at our office in Business Bay, Dubai, or talk it through online." },
  { title: "Continued support", body: "Tax, accounting and compliance guidance as your business grows." },
];

/* Home page FAQ and its FAQPage JSON-LD (FAQS below is still used by /services). */
export const HOME_FAQS = [
  {
    q: "What does a consultation cover?",
    a: "You tell us about your plans. Your advisor explains the mainland, free zone and offshore options that could fit, what to think about with each and what to budget for, so you can decide your next step.",
  },
  {
    q: "Which is right for me: mainland, free zone or offshore?",
    a: "It depends on your activity, where your customers are and how you want to work. Your advisor compares the options with you in plain terms.",
  },
  { q: "Do I need to be in the UAE for the consultation?", a: "No. You can meet us in Business Bay or talk it through by video call." },
  { q: "Who will handle my enquiry?", a: CLAIMS.oneAdvisor ? "A dedicated advisor from our Business Bay office." : "An advisor from our Business Bay office." },
  { q: "Do you help businesses that are already running?", a: "Yes. We give ongoing tax, accounting and compliance guidance." },
  {
    q: "Are you a government office?",
    a: "No. Best Solution is a private business consultancy. We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities.",
  },
];

export interface Review {
  title: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  lang?: string;
  photo: string;
  logo: string;
}

/* `photo` and `logo` are given as file slugs and expanded to their public paths. */
const review = (r: Review): Review => ({
  ...r,
  photo: `/testimonials/${r.photo}.webp`,
  logo: `/testimonials/logo-${r.logo}.webp`,
});

/** A reviewer is shown by first name only. */
export const firstName = (name: string) => name.split(" ")[0];

/* Two marquee rows of verified Google reviews. Titles are word-for-word phrases from the quote itself. */
export const REVIEW_ROWS: Review[][] = [
  [
    review({
      title: "In safe hands",
      quote: "25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands.",
      name: "Michael Doherty",
      role: "Chief Executive Officer",
      company: "Doherty Capital",
      photo: "michael-doherty",
      logo: "doherty-capital",
    }),
    review({
      title: "Transparent and Professional",
      quote: "No hidden charges, no surprises. Exactly what was promised, delivered on time.",
      name: "Chandra Mohan",
      role: "Business Development Manager",
      company: "Prism Advertising",
      photo: "chandra-mohan",
      logo: "prism-advertising",
    }),
    review({
      title: "Everything became structured",
      quote: "Everything became structured, professional, and stress-free after switching to Best Solution.",
      name: "Hadi Hamedi",
      role: "Chief Executive Officer",
      company: "Soft Miller",
      photo: "hadi-hamedi",
      logo: "soft-miller",
    }),
  ],
  [
    review({
      title: "Seamless Process, Patient Guidance",
      quote: "Highly recommend this team for anyone looking for reliable business setup services. They were professional, efficient, and extremely supportive throughout the entire process.",
      name: "Javed Khan",
      role: "Co-Founder",
      company: "Javed Rafik",
      photo: "javed-khan",
      logo: "javed-rafik",
    }),
    review({
      title: "Exceptional Service for International Entrepreneurs",
      quote: "La mejor compañía de servicios para crear tu empresa en Dubai. Rápidos, responsables y siempre disponibles.",
      lang: "es",
      name: "Carlos Freyre",
      role: "Chief Executive Officer",
      company: "Rentalho Vacation Homes",
      photo: "carlos-freyre",
      logo: "rentalho-vacation-homes",
    }),
    review({
      title: "Top-Rated UAE Business Setup Partner",
      quote: "One of the best business setup firms in Dubai. Highly recommended.",
      name: "Tanwir Chowdhury",
      role: "Chief Executive Officer",
      company: "Bangla Shoppers",
      photo: "tanwir-chowdhury",
      logo: "bangla-shoppers",
    }),
  ],
];

/*
  REVIEWS: the real Google reviews shown on /services, /freezone, /mainland, /offshore and the home page. Add one only
  from the live Google profile:
  - quote: word for word, as on Google (set `lang` when it is not English)
  - name: first name only
  - role and company: only if they are shown on the Google review
  - photo: optional; without it the card shows the first initial in a neutral circle
  - title: optional, a phrase taken word for word from the quote
  No licence, visa, residency, price or timing wording (REVIEW_BANNED; src/content/site.test.ts checks every quote).
  Each review shows once per loop; with fewer than four the row stands still instead of scrolling.
*/
export interface SiteReview {
  quote: string;
  name: string;
  title?: string;
  role?: string;
  company?: string;
  lang?: string;
  photo?: string;
  logo?: string;
}
export const REVIEW_BANNED =
  /licen[cs]e|\bvisas?\b|residen|\bprices?\b|\bcosts?\b|\bfees?\b|\bcharges?\b|\bAED\b|cheap|(?<![-\w])free\b|on time|\bfast\b|\bquick|\b\d+\s*(days?|weeks?|hours?|minutes?)\b|same[- ]day|guarantee/i;
export const REVIEWS: SiteReview[] = [
  {
    title: "In safe hands",
    quote: "25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands.",
    name: "Michael",
    role: "Chief Executive Officer",
    company: "Doherty Capital",
    photo: "/testimonials/michael-doherty.webp",
    logo: "/testimonials/logo-doherty-capital.webp",
  },
  {
    title: "Everything became structured",
    quote: "Everything became structured, professional, and stress-free after switching to Best Solution.",
    name: "Hadi",
    role: "Chief Executive Officer",
    company: "Soft Miller",
    logo: "/testimonials/logo-soft-miller.webp",
  },
];
/** Scroll the review row only once there are enough reviews to fill it without repeating one on screen. */
export const REVIEWS_SCROLL = REVIEWS.length >= 4;

export const FAQS = [
  {
    q: "How much does a UAE company cost?",
    a: "The cost depends on your activity, jurisdiction and team size. The calculator provides an itemised estimate, and your consultant confirms the exact figure.",
  },
  {
    q: "Is the calculator result a final price?",
    a: "No. It is an estimate for planning purposes. Your final cost is confirmed in writing following your consultation.",
  },
  { q: "Is there a charge for the consultation?", a: "No. The consultation is complimentary and carries no obligation." },
  { q: "Do I need to be in the UAE?", a: "Not in every case. Your consultant will advise on what applies to you." },
  { q: "Who will handle my enquiry?", a: "A dedicated consultant from our Business Bay office." },
  {
    q: "Is Best Solution a government entity?",
    a: "No. Best Solution is a private business consultancy. We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities.",
  },
];
