import type { Jurisdiction } from "@/lib/pricing";

export const SITE = {
  name: "Best Solution",
  url: "https://www.best-solution.ae",
  phone: { display: "+971 52 233 0011", href: "tel:+971522330011" },
  whatsapp: "https://wa.me/97145531546",
  email: "connect@best-solution.ae",
  privacy: "https://www.best-solution.ae/privacy-policy/",
  terms: "https://www.best-solution.ae/terms-conditions/",
  googleReviews: "https://www.google.com/search?q=Best+Solution+Business+Consultancy+Dubai+reviews",
  ogImage: "https://www.best-solution.ae/og_image.jpg",
  mainPhoto: "/images/main.webp",
  logo: "/brand/logo.webp",
  mark: "/brand/mark.webp",
  /** Opening hours, shared by the home page and /freezone. */
  hours: { long: "Monday to Friday, 9am to 6pm", short: "Mon to Fri, 9AM to 6PM" },
  /** Founding year, shared by the home page and /freezone. */
  founded: 2014,
};

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
  { href: "#calculator", label: "Cost Calculator" },
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
  { title: "Free Zones", links: ["DMCC", "IFZA", "Meydan", "Shams", "RAKEZ", "JAFZA"].map((label) => ({ label })) },
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

export interface JurisdictionCopy {
  title: string;
  cta: string;
  best: string;
  suited: string;
  market: string;
  owner: string;
  office: string;
  tax: string;
  photo: string;
  photoPosition: string;
}

export const JURIS: Record<Jurisdiction, JurisdictionCopy> = {
  mainland: {
    title: "Mainland",
    cta: "Estimate a mainland setup",
    best: "For businesses trading directly across the UAE",
    suited: "Suited to businesses trading directly across the UAE.",
    market: "Across all emirates",
    owner: "100% foreign ownership",
    office: "Tenancy contract",
    tax: "9% on profit above AED 375,000",
    photo: "/images/mainland-dubai-economy-tourism.webp",
    photoPosition: "60% center",
  },
  freezone: {
    title: "Free zone",
    cta: "Estimate a free zone setup",
    best: "For international and B2B operations",
    suited: "Suited to international and business-to-business operations.",
    market: "UAE and international B2B",
    owner: "100% foreign ownership",
    office: "Flexi-desk or physical office",
    tax: "0% on qualifying income, 9% on non-qualifying",
    photo: "/images/free-zone-business-park-office.webp",
    photoPosition: "35% center",
  },
  offshore: {
    title: "Offshore",
    cta: "Estimate an offshore setup",
    best: "For holding and international structures",
    suited: "Suited to holding structures and asset protection.",
    market: "International only",
    owner: "100% foreign ownership",
    office: "No office required",
    tax: "Depends on structure and UAE corporate tax rules",
    photo: "/images/offshore-company-structure.webp",
    photoPosition: "85% center",
  },
};

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

/* Two marquee rows of verified Google reviews. */
export const REVIEW_ROWS: Review[][] = [
  [
    review({
      title: "Unmatched Professionalism",
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
      title: "Reliable and Stress-Free Support",
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
    q: "How much does it cost to establish a business in the UAE?",
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
    a: "No. Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Licences and residency approvals are issued solely by the relevant UAE authorities.",
  },
];
