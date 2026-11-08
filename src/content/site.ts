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
  logo: "/brand/logo.webp",
  mark: "/brand/mark.webp",
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

/** Shown under every hero and in every footer (Google Ads: "Clearly disclose that you are a private entity"). */
export const DISCLAIMER =
  "Best Solution is a private business consultancy. We are not affiliated with any government entity or free zone authority. Official decisions are made only by the relevant UAE authorities.";

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
} = { since: null, rating: null, businesses: null, countries: null, team: null, ownership: null, zones: null, emirates: null, packageSaving: null };

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
  { name: "UAQ Free Trade Zone", file: "uaq-free-trade-zone" },
  { name: "SRTIP", file: "srtip" },
].map((a) => ({ ...a, src: `/authorities/${a.file}.webp` }));

export const NAV = [
  { href: "#calculator", label: "Plan with an advisor" },
  { href: "#consultation", label: "Consultation" },
  { href: "#jurisdiction", label: "Jurisdictions" },
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
  { title: "Mainland", links: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"].map((label) => ({ label })) },
];

export const TRUST = [
  { count: 5000, suffix: "+", label: "Businesses advised" },
  { count: 80, suffix: "+", label: "Client countries" },
  { count: 200, suffix: "+", label: "Google reviews" },
];

export const WHY = [
  { title: "A dedicated consultant", body: "Your advisor remains your single point of contact throughout." },
  { title: "Fees in writing", body: "Fees are confirmed in writing before you proceed." },
  { title: "In-house expertise", body: "Specialists across company structuring, taxation, accounting and compliance, under one roof." },
  { title: "Emirati-owned", body: "Founded by Essa Al Harthi and based in Business Bay, Dubai." },
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
  { title: "A dedicated advisor", body: "One advisor stays your point of contact from the first conversation." },
  { title: "Advice in plain terms", body: "We explain your options clearly, so you can compare them and decide." },
  { title: "In-house expertise", body: "Specialists in company structure, tax, accounting and compliance, under one roof." },
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
  { q: "Who will handle my enquiry?", a: "A dedicated advisor from our Business Bay office." },
  { q: "Do you help businesses that are already running?", a: "Yes. We give ongoing tax, accounting and compliance guidance." },
  {
    q: "Are you a government office?",
    a: "No. Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Official decisions are made only by the relevant UAE authorities.",
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
    a: "No. Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Official decisions are made only by the relevant UAE authorities.",
  },
];
