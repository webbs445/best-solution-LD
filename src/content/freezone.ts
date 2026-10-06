/* ============================================================
   /freezone page content and rate card.
   RATE CARD: copied from best-solution.ae/pricing (the free zone landing page's own copy).
   Update here when the rate card changes.
   price = the published "from" price.
   exact = published year-one package totals by number of people needing residency.
   ============================================================ */

import ACTIVITY_ICONS from "./activity-icons.json";

export type Emirate = "Dubai" | "Abu Dhabi" | "Sharjah" | "Northern Emirates";

/** Business types on the planner and the zone tags. */
export type ActKey = "trading" | "services" | "ecommerce" | "media" | "tech" | "logistics" | "finance" | "health";

/** Sectors used by the activity search. */
export type SectorKey =
  | ActKey
  | "general"
  | "industrial"
  | "education"
  | "food"
  | "realestate"
  | "crypto"
  | "commodities"
  | "tourism"
  | "auto"
  | "holding"
  | "events";

/** Zone filter groups. */
export type ZoneGroup = "value" | "dubai" | "sector" | "trade" | "finance";

export interface Zone {
  id: string;
  name: string;
  price: number;
  emirate: Emirate;
  exact?: Record<string, number>;
  /** One-line description. */
  d: string;
  /** Business types the zone is best known for, in order. */
  t: ActKey[];
  /** Filter groups. */
  g: ZoneGroup[];
  /** Every sector the zone typically covers (indicative). */
  sect: SectorKey[];
  /** [short name, monogram]. */
  short: [string, string];
  /** Logo in /public/zones, if we have one. */
  logo?: string;
}

const z = (
  id: string,
  name: string,
  price: number,
  emirate: Emirate,
  d: string,
  t: ActKey[],
  g: ZoneGroup[],
  sect: SectorKey[],
  short: [string, string],
  logo?: string,
  exact?: Record<string, number>,
): Zone => ({ id, name, price, emirate, d, t, g, sect, short, logo: logo && `/zones/${logo}`, exact });

export const ZONES: Zone[] = [
  z("f0", "IFZA (Dubai)", 12900, "Dubai", "Flexible setup with a wide activity range",
    ["services", "trading", "ecommerce", "tech"], ["dubai"],
    ["trading", "general", "services", "ecommerce", "media", "tech", "education", "food", "tourism", "holding", "logistics", "events", "realestate"],
    ["IFZA", "IFZA"], "ifza.webp", { "0": 12900, "1": 17680, "2": 24210, "3": 30740, "4": 37270 }),
  z("f1", "Meydan Free Zone", 12520, "Dubai", "Central Dubai address for e-commerce and consultancy",
    ["ecommerce", "services"], ["dubai"],
    ["trading", "general", "services", "ecommerce", "media", "tech", "education", "food", "tourism", "holding", "logistics", "events", "crypto", "realestate"],
    ["Meydan", "MFZ"], "meydan.webp", { "0": 12520, "1": 22710, "2": 30880 }),
  z("f2", "DMCC", 35484, "Dubai", "Commodities and trade hub in Jumeirah Lakes Towers",
    ["trading", "services", "tech"], ["dubai", "trade"],
    ["trading", "general", "services", "ecommerce", "tech", "commodities", "crypto", "food", "holding", "education", "media", "logistics", "industrial", "events"],
    ["DMCC", "DMCC"], "dmcc.webp"),
  z("f3", "JAFZA (Jebel Ali)", 45000, "Dubai", "Trading, logistics and industry with port access",
    ["trading", "logistics"], ["dubai", "trade"],
    ["trading", "general", "logistics", "industrial", "auto", "food", "holding", "services", "ecommerce", "commodities"],
    ["JAFZA", "JAFZA"], "jafza.svg"),
  z("f4", "Dubai Silicon Oasis / DIEZ", 12000, "Dubai", "Technology, trading and services in an integrated zone",
    ["tech", "trading", "services"], ["dubai"],
    ["tech", "trading", "general", "services", "ecommerce", "education", "industrial", "holding", "media"],
    ["Silicon Oasis", "DSO"], "dubai-silicon-oasis.svg"),
  z("f5", "Dubai Internet City", 20550, "Dubai", "Technology and IT companies",
    ["tech"], ["dubai", "sector"],
    ["tech", "ecommerce", "services", "media"],
    ["Internet City", "DIC"], "dubai-internet-city.webp"),
  z("f6", "Dubai Media City", 29000, "Dubai", "Media, marketing and creative businesses",
    ["media"], ["dubai", "sector"],
    ["media", "services", "events", "tech"],
    ["Media City", "DMC"], "dubai-media-city.webp"),
  z("f7", "Dubai Airport Free Zone (DAFZA)", 25000, "Dubai", "Aviation, logistics and high-value trade",
    ["trading", "logistics"], ["dubai", "trade"],
    ["trading", "general", "logistics", "services", "tech", "ecommerce", "commodities", "holding", "health"],
    ["DAFZA", "DAFZA"], "dafza.webp"),
  z("f8", "Dubai South (DWC)", 12540, "Dubai", "Logistics, aviation and e-commerce",
    ["logistics", "ecommerce"], ["dubai", "trade"],
    ["logistics", "trading", "general", "ecommerce", "services", "industrial", "auto", "events"],
    ["Dubai South", "DWC"], "dubai-south.svg", { "0": 12540, "1": 23690, "2": 32840 }),
  z("f9", "Dubai Healthcare City", 25000, "Dubai", "Clinical and allied health businesses",
    ["health"], ["dubai", "sector"],
    ["health", "education", "services"],
    ["Healthcare City", "DHCC"], "dubai-healthcare-city.svg"),
  z("f10", "DIFC", 50000, "Dubai", "Financial services and holding companies, common law",
    ["finance"], ["dubai", "finance"],
    ["finance", "holding", "services", "crypto", "tech"],
    ["DIFC", "DIFC"], "difc.webp"),
  z("f11", "Dubai CommerCity", 14060, "Dubai", "A free zone dedicated to e-commerce",
    ["ecommerce"], ["dubai", "sector"],
    ["ecommerce", "logistics", "trading", "tech"],
    ["CommerCity", "DCC"], "dubai-commercity.svg", { "0": 14060, "1": 19969.5, "2": 25393 }),
  z("f12", "ADGM", 39300, "Abu Dhabi", "International financial centre in Abu Dhabi, common law",
    ["finance"], ["finance"],
    ["finance", "holding", "services", "crypto", "tech"],
    ["ADGM", "ADGM"], "adgm.svg"),
  z("f13", "KEZAD", 9450, "Abu Dhabi", "Industrial, logistics and trading in Abu Dhabi",
    ["logistics", "trading"], ["trade"],
    ["industrial", "logistics", "trading", "general", "food", "auto", "commodities"],
    ["KEZAD", "KEZAD"], "kezad.webp"),
  z("f14", "Masdar City Free Zone", 7010, "Abu Dhabi", "Clean technology, renewable energy and innovation",
    ["tech"], ["sector"],
    ["tech", "services", "education", "industrial", "holding", "trading"],
    ["Masdar City", "MCFZ"], "masdar-city.webp", { "0": 7010, "1": 19500 }),
  z("f15", "SHAMS (Sharjah Media City)", 6885, "Sharjah", "Media, creative and service businesses",
    ["media", "services", "ecommerce"], ["value"],
    ["media", "services", "ecommerce", "tech", "trading", "general", "education", "food", "tourism", "holding", "events"],
    ["SHAMS", "SHAMS"], "shams.webp", { "0": 6885, "1": 15645, "2": 21485, "3": 27325 }),
  z("f16", "SAIF Zone", 12000, "Sharjah", "Airport-linked trading, logistics and light industry",
    ["trading", "logistics"], ["trade"],
    ["trading", "general", "logistics", "industrial", "services", "auto", "food", "ecommerce", "holding"],
    ["SAIF Zone", "SAIF"], "saif-zone.webp"),
  z("f17", "Hamriyah Free Zone (HFZA)", 11000, "Sharjah", "Industrial, manufacturing and trading with port access",
    ["logistics", "trading"], ["trade"],
    ["industrial", "trading", "general", "logistics", "commodities", "food", "auto"],
    ["Hamriyah", "HFZA"], "hamriyah.webp"),
  z("f18", "SPC Free Zone", 6885, "Sharjah", "Publishing, media and a broad list of activities",
    ["media", "services", "ecommerce"], ["value"],
    ["media", "services", "ecommerce", "tech", "trading", "general", "education", "food", "tourism", "holding", "events"],
    ["SPC", "SPC"], "spc.webp", { "0": 6885, "1": 15030, "2": 20245, "3": 25460, "4": 30675 }),
  z("f19", "SRTIP", 5510, "Sharjah", "Research, technology and innovation in Sharjah",
    ["tech"], ["value", "sector"],
    ["tech", "services", "education", "industrial", "health"],
    ["SRTIP", "SRTIP"], "srtip.webp", { "0": 5510, "1": 15120, "2": 19575 }),
  z("f20", "Ajman Free Zone (AFZ)", 5565, "Northern Emirates", "Trading, services and industrial activities",
    ["trading", "services", "logistics"], ["value"],
    ["trading", "general", "services", "industrial", "ecommerce", "media", "tech", "food", "logistics", "auto", "holding", "tourism", "events"],
    ["Ajman FZ", "AFZ"], "ajman-free-zone.webp", { "0": 5565, "1": 13141, "2": 17181 }),
  z("f21", "Ajman Nu Venture Free Zone", 4898, "Northern Emirates", "Media and service businesses on a lean budget",
    ["media", "services"], ["value"],
    ["services", "media", "ecommerce", "tech", "trading", "general", "education", "food", "tourism", "holding", "events"],
    ["Nu Venture", "ANV"], "ajman-nu-venture.webp", { "0": 4898, "1": 11460, "2": 17510, "3": 22660, "4": 27810 }),
  z("f22", "RAKEZ", 9110, "Northern Emirates", "Trading, services and industrial in Ras Al Khaimah",
    ["trading", "services", "logistics", "ecommerce"], ["value"],
    ["trading", "general", "services", "industrial", "ecommerce", "media", "tech", "education", "food", "logistics", "holding", "tourism", "auto", "events"],
    ["RAKEZ", "RAKEZ"], "rakez.webp", { "0": 9110, "1": 14482.5, "2": 18955, "3": 23427.5, "4": 27900 }),
  z("f23", "RAK Maritime City", 18000, "Northern Emirates", "Maritime, industrial and trading activities",
    ["logistics", "trading"], ["trade"],
    ["logistics", "industrial", "trading"],
    ["RAK Maritime", "RAKMC"]),
  z("f24", "Innovation City", 6600, "Northern Emirates", "Digital assets and Web3 companies",
    ["tech"], ["value", "sector"],
    ["crypto", "tech", "services", "holding"],
    ["Innovation City", "IC"], "innovation-city.svg"),
  z("f25", "Fujairah Free Zone (FFZ)", 21500, "Northern Emirates", "Trading, logistics and industry on the east coast",
    ["trading", "logistics"], ["trade"],
    ["trading", "general", "logistics", "industrial", "commodities", "auto", "food"],
    ["Fujairah FZ", "FFZ"], "fujairah-free-zone.webp"),
  z("f26", "Creative City Fujairah", 5530, "Northern Emirates", "Media, consultancy and service businesses",
    ["media", "services"], ["value"],
    ["media", "services", "ecommerce", "tech", "trading", "education", "events", "holding"],
    ["Creative City", "CCF"], "creative-city-fujairah.webp", { "0": 5530, "1": 13530 }),
  z("f27", "Umm Al Quwain (UAQ FTZ)", 5500, "Northern Emirates", "Trading, services and micro-businesses",
    ["trading", "services"], ["value"],
    ["trading", "general", "services", "ecommerce", "media", "tech", "industrial", "food", "logistics", "holding", "tourism", "events"],
    ["UAQ FTZ", "UAQ"], "uaq-ftz.webp"),
];

export const ZONE_BY_ID: Record<string, Zone> = Object.fromEntries(ZONES.map((zn) => [zn.id, zn]));

export const EMIRATES: Emirate[] = ["Dubai", "Abu Dhabi", "Sharjah", "Northern Emirates"];

export const EM_SHORT: Record<Emirate, string> = {
  Dubai: "Dubai",
  "Abu Dhabi": "Abu Dhabi",
  Sharjah: "Sharjah",
  "Northern Emirates": "Northern",
};

/* Add-on rates, as used by the quote builder on best-solution.ae/pricing */
export const RATES = {
  residencyPerPerson: 5500, // per person, 2 years
  establishmentCard: 2500, // once, when at least one person needs residency
  bank: 3000,
  renewalShare: 0.9, // year-two renewal as a share of the base setup price
};

/** Upper bound on residency when no package table applies. */
export const DEFAULT_MAX_RESIDENTS = 6;

export const ACT_LABEL: Record<ActKey, string> = {
  trading: "Trading",
  services: "Consulting",
  ecommerce: "E-commerce",
  media: "Media",
  tech: "Technology",
  logistics: "Logistics",
  finance: "Finance",
  health: "Healthcare",
};

export const SECT: Record<SectorKey, string> = {
  trading: "Trading",
  general: "General trading",
  services: "Consulting and services",
  ecommerce: "E-commerce",
  media: "Media and marketing",
  tech: "Technology",
  logistics: "Logistics",
  finance: "Financial services",
  health: "Healthcare",
  industrial: "Manufacturing",
  education: "Education and training",
  food: "Food and beverage",
  realestate: "Real estate services",
  crypto: "Crypto and Web3",
  commodities: "Gold and commodities",
  tourism: "Travel and tourism",
  auto: "Vehicles and auto",
  holding: "Holding",
  events: "Events",
};

/** A searchable business activity: [name, sector, synonyms, needs an extra regulator approval]. */
export type Activity = [name: string, sector: SectorKey, synonyms: string, approval?: 1];

export const ACTS: Activity[] = [
  ["General trading", "general", "import export multiple products all goods wholesale"],
  ["Import and export", "trading", "import export wholesale distribution trade"],
  ["Electronics trading", "trading", "mobile phones laptops computers gadgets accessories"],
  ["Mobile phone trading", "trading", "phones smartphones accessories"],
  ["Computer and IT hardware trading", "trading", "laptops servers networking hardware"],
  ["Garments and textiles trading", "trading", "clothing fashion apparel fabrics textile"],
  ["Footwear and bags trading", "trading", "shoes handbags leather"],
  ["Cosmetics and perfumes trading", "trading", "beauty skincare makeup perfume fragrance oud"],
  ["Furniture trading", "trading", "home furniture office furniture interiors"],
  ["Building materials trading", "trading", "construction materials cement steel tiles sanitary"],
  ["Spare parts trading", "auto", "auto parts car parts tyres"],
  ["Used car trading", "auto", "vehicles cars export automobile"],
  ["New vehicle trading", "auto", "cars trucks motorcycles vehicle export"],
  ["Heavy equipment trading", "trading", "machinery equipment generators"],
  ["Medical equipment trading", "trading", "medical devices hospital supplies"],
  ["Pharmaceutical trading", "health", "medicines drugs pharma", 1],
  ["Toys and games trading", "trading", "kids toys games"],
  ["Jewellery trading", "commodities", "jewelry jewellery gold ornaments"],
  ["Gold and precious metals trading", "commodities", "gold silver bullion precious metals", 1],
  ["Diamond trading", "commodities", "diamonds gemstones precious stones", 1],
  ["Oil and petroleum products trading", "commodities", "oil petroleum lubricants fuel energy", 1],
  ["Metals and scrap trading", "commodities", "steel aluminium copper scrap metal"],
  ["Coffee and tea trading", "food", "coffee beans tea"],
  ["Foodstuff trading", "food", "food trading groceries packaged food rice spices", 1],
  ["Fruits and vegetables trading", "food", "fresh produce fruit vegetables", 1],
  ["Restaurant or cafe", "food", "restaurant cafe coffee shop cloud kitchen catering", 1],
  ["Catering services", "food", "catering events food service", 1],
  ["Cloud kitchen", "food", "delivery kitchen dark kitchen", 1],
  ["Agricultural products trading", "food", "agriculture seeds fertiliser animal feed"],
  ["Management consultancy", "services", "consultant consulting business advisory strategy"],
  ["Business consultancy", "services", "consultant consulting business setup advisory"],
  ["IT consultancy", "tech", "it consulting technology consultant"],
  ["HR consultancy", "services", "human resources hr consultant"],
  ["Recruitment and staffing", "services", "recruitment manpower staffing headhunting", 1],
  ["Marketing consultancy", "media", "marketing consultant strategy brand"],
  ["Digital marketing agency", "media", "digital marketing seo sem ppc google ads agency"],
  ["Social media management", "media", "social media instagram tiktok influencer management"],
  ["Advertising agency", "media", "advertising ads agency campaign"],
  ["Public relations", "media", "pr communications press"],
  ["Branding and graphic design", "media", "design graphic designer logo branding creative"],
  ["Video and film production", "media", "video production film photography studio", 1],
  ["Photography services", "media", "photographer photo studio"],
  ["Content creation and influencer", "media", "content creator influencer youtuber blogger"],
  ["Publishing", "media", "books magazine publisher printing", 1],
  ["Printing services", "media", "printing print press"],
  ["Music and entertainment", "media", "music artist entertainment"],
  ["Event management", "events", "events organiser exhibitions conferences weddings"],
  ["Exhibition organising", "events", "exhibitions trade shows expo"],
  ["Software development", "tech", "software developer programming coding apps saas"],
  ["Mobile app development", "tech", "app developer ios android mobile apps"],
  ["Web design and development", "tech", "website web developer web design"],
  ["Artificial intelligence services", "tech", "ai machine learning data science artificial intelligence"],
  ["Cyber security services", "tech", "cybersecurity security penetration testing"],
  ["Data analytics", "tech", "data analysis big data bi"],
  ["Cloud and hosting services", "tech", "cloud hosting servers data centre"],
  ["IT support and networking", "tech", "it support network installation maintenance"],
  ["Gaming and esports", "tech", "games game development esports"],
  ["Fintech", "finance", "fintech payments financial technology", 1],
  ["Crypto and blockchain services", "crypto", "crypto cryptocurrency blockchain web3 nft token dao", 1],
  ["Virtual asset trading", "crypto", "crypto trading bitcoin virtual assets exchange", 1],
  ["Web3 and NFT projects", "crypto", "web3 nft metaverse dao defi"],
  ["E-commerce store", "ecommerce", "online store online shop ecommerce shopify website selling"],
  ["Amazon and marketplace seller", "ecommerce", "amazon noon marketplace seller online selling fba"],
  ["Dropshipping", "ecommerce", "dropshipping online store"],
  ["Online education platform", "education", "e-learning online courses edtech"],
  ["Training and coaching", "education", "training courses coaching workshops", 1],
  ["Educational consultancy", "education", "education consultant student admissions"],
  ["Language institute", "education", "language courses tutoring", 1],
  ["Freight forwarding", "logistics", "freight forwarder cargo shipping air freight sea freight"],
  ["Logistics services", "logistics", "logistics supply chain transport"],
  ["Warehousing and storage", "logistics", "warehouse storage fulfilment 3pl"],
  ["Courier and delivery", "logistics", "courier delivery last mile parcels", 1],
  ["Shipping and ship management", "logistics", "shipping ship management maritime vessel marine"],
  ["Marine services", "logistics", "marine ship chandlers boats yacht"],
  ["Manufacturing", "industrial", "manufacturing factory production assembly"],
  ["Food processing", "industrial", "food factory processing packaging", 1],
  ["Packaging manufacturing", "industrial", "packaging boxes plastic"],
  ["Garment manufacturing", "industrial", "clothing factory tailoring"],
  ["Steel fabrication", "industrial", "fabrication metal works welding"],
  ["Chemical products", "industrial", "chemicals paints coatings", 1],
  ["3D printing", "industrial", "3d printing additive manufacturing"],
  ["Renewable energy", "industrial", "solar energy renewables clean tech cleantech"],
  ["Medical clinic", "health", "clinic doctor medical centre", 1],
  ["Healthcare consultancy", "health", "healthcare consultant medical consulting"],
  ["Wellness and fitness", "health", "fitness gym wellness yoga spa", 1],
  ["Medical tourism", "health", "medical tourism patients"],
  ["Holding company", "holding", "holding company asset holding investments"],
  ["Investment company", "holding", "investment portfolio private investment"],
  ["Family office", "holding", "family office wealth"],
  ["Financial advisory", "finance", "financial advisor wealth management", 1],
  ["Asset management", "finance", "fund management asset manager", 1],
  ["Insurance brokerage", "finance", "insurance broker", 1],
  ["Accounting and bookkeeping", "services", "accountant accounting bookkeeping"],
  ["Auditing", "services", "audit auditor", 1],
  ["Tax consultancy", "services", "tax consultant vat corporate tax"],
  ["Legal consultancy", "services", "legal consultant lawyer advisory", 1],
  ["Translation services", "services", "translator translation interpretation"],
  ["Architecture and interior design", "services", "architect interior designer fit out", 1],
  ["Engineering consultancy", "services", "engineer engineering consultant", 1],
  ["Real estate brokerage", "realestate", "property broker real estate agent", 1],
  ["Property management", "realestate", "property manager facilities"],
  ["Real estate consultancy", "realestate", "property consultant real estate advisory"],
  ["Travel agency", "tourism", "travel agent tickets holidays", 1],
  ["Tour operator", "tourism", "tours tourism desert safari", 1],
  ["Car rental", "auto", "car rental rent a car vehicle leasing", 1],
  ["Cleaning services", "services", "cleaning facility management"],
  ["Security consultancy", "services", "security consultant", 1],
  ["Beauty salon", "services", "salon beauty hair nails", 1],
  ["Pet services", "services", "pets grooming pet shop"],
  ["Freelancer", "services", "freelance freelancer self employed individual"],
  ["Aviation services", "logistics", "aviation aircraft aerospace"],
  ["Research and development", "tech", "research r&d innovation lab"],
  ["Biotechnology", "health", "biotech life sciences research", 1],
];

export const POPULAR_ACTS = [
  "General trading",
  "Management consultancy",
  "E-commerce store",
  "Digital marketing agency",
  "Software development",
  "Real estate brokerage",
];

/** A limit that can differ between packages without residency (0) and with residency (v). */
type Limit = number | { 0: number; v: number };

export interface PackageTerms {
  sh?: Limit;
  shFee?: number;
  act?: Limit;
  actFee?: number;
  actTxt: string;
  shTxt: string;
  /** Multi-year package totals with no residency: [years, AED]. */
  years?: [number, number][];
  note?: string;
}

/* Package terms from the Best Solution free zone rate card. Update these values whenever the rate card changes. */
export const PK: Record<string, PackageTerms> = {
  f0: { act: 3, actTxt: "Up to 3 activities", shTxt: "AED 500 pre-approval per shareholder", years: [[2, 21900], [3, 31000], [5, 45200]], note: "Investor residency needs share capital of AED 50,000, with a bank statement as proof." },
  f1: { sh: 6, shFee: 2000, act: 7, actFee: 1000, actTxt: "Up to 7 activities (3 groups)", shTxt: "Up to 6 shareholders", note: "Investor residency needs share capital of AED 50,000, with a bank statement as proof." },
  f8: { sh: 6, act: 5, actFee: 2000, actTxt: "Up to 5 activities", shTxt: "Up to 6 shareholders", years: [[2, 25080], [3, 37620], [4, 50160]] },
  f11: { act: 3, actTxt: "Up to 3 activities from one industry group", shTxt: "Limit confirmed by your advisor", note: "Extra activities cost AED 900 to 8,000 each. A General Trading option is AED 25,000 and needs a 50+ sqm office." },
  f14: { sh: 3, shFee: 3000, act: { 0: 2, v: 3 }, actFee: 1500, actTxt: "2 activities (no residency) or 3 (with residency)", shTxt: "Up to 3 shareholders", note: "Setups without residency use the Start-up package. One residency uses the Business One package." },
  f15: { act: 5, actTxt: "Any 5 activities", shTxt: "Limit confirmed by your advisor" },
  f18: { sh: 7, shFee: 1000, act: 5, actFee: 2200, actTxt: "Up to 5 activities", shTxt: "Up to 7 shareholders", years: [[2, 13770], [3, 20655]] },
  f19: { sh: 5, act: 5, actTxt: "5 activities, mix of trading, services and e-commerce", shTxt: "Up to 5 shareholders", years: [[2, 9350], [3, 13200]] },
  f20: { sh: 10, act: 10, actTxt: "Up to 10 activities (General Trading AED 2,000 extra)", shTxt: "Up to 10 shareholders", years: [[2, 11130], [3, 16695], [4, 22260]] },
  f21: { sh: 999, act: 10, actTxt: "Up to 10 mix and match activities", shTxt: "Unlimited shareholders", years: [[2, 9776], [3, 14664], [4, 19552]] },
  f22: { sh: { 0: 50, v: 2 }, act: { 0: 10, v: 10 }, actTxt: "Up to 10 activities", shTxt: "Up to 50 (no residency) or 2 (residency packages)", years: [[2, 10820], [3, 15330], [4, 20440]] },
  f26: { sh: { 0: 2, v: 3 }, act: 5, actTxt: "Up to 5 activities", shTxt: "2 (no residency) or 3 (1 residency)", note: "The 1 residency package allows family sponsorship." },
};

/* Lucide icon bodies for the activity search, keyed by activity name. */
const ICONS = ACTIVITY_ICONS as { map: Record<string, string>; icons: Record<string, string> };

/** The inner SVG markup of an activity's icon (static Lucide paths from our own content file). */
export function activityIcon(name: string): string {
  return ICONS.icons[ICONS.map[name]] || ICONS.icons["briefcase-business"];
}

/* Planner options. */
export const PLANNER_ACTS: { v: ActKey; label: string; icon: string }[] = [
  { v: "trading", label: "Trading", icon: '<path d="M3 7h18l-2 10H5L3 7z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>' },
  { v: "services", label: "Consulting and services", icon: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 13h18"/>' },
  { v: "ecommerce", label: "E-commerce", icon: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>' },
  { v: "media", label: "Media and creative", icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3V9z"/>' },
  { v: "tech", label: "Technology", icon: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M8 20h8M12 16v4M9 9l-2 1.5L9 12M15 9l2 1.5-2 1.5"/>' },
  { v: "logistics", label: "Logistics and industrial", icon: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>' },
  { v: "finance", label: "Financial services", icon: '<path d="M3 10 12 4l9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18"/>' },
  { v: "health", label: "Healthcare", icon: '<path d="M12 21s-8-4.5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6.5-8 11-8 11z"/><path d="M12 9v5M9.5 11.5h5"/>' },
];

export type Priority = "cost" | "dubai" | "sector";

export const PRIORITIES: { v: Priority; label: string }[] = [
  { v: "cost", label: "Lowest cost" },
  { v: "dubai", label: "Dubai address" },
  { v: "sector", label: "Specialist zone" },
];

/* Hero ticker: an activity and a zone often suited to it. */
export const HERO_DEMO: [ActKey, string][] = [
  ["ecommerce", "f1"],
  ["tech", "f5"],
  ["trading", "f22"],
  ["media", "f15"],
  ["services", "f0"],
  ["logistics", "f8"],
  ["finance", "f10"],
];

/* Google Ads sitelink routes: /freezone/<view> serves this page and opens the matching section (FzSitelink). */
export const FZ_SITELINK_VIEWS = ["planner", "compare", "activity", "budget", "vs-mainland", "consultation", "dubai"] as const;
export type FzSitelinkView = (typeof FZ_SITELINK_VIEWS)[number];

/* On-page navigation (header, mobile menu and footer). */
export const FZ_NAV = [
  { href: "#planner", label: "Zone Planner" },
  { href: "#zones", label: "Compare Zones" },
  { href: "#process", label: "How It Works" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export type FaqTopic = "cost" | "choose" | "tax" | "us";

export const FZ_FAQ_TOPICS: { c: FaqTopic | "all"; label: string }[] = [
  { c: "all", label: "All" },
  { c: "cost", label: "Cost" },
  { c: "choose", label: "Choosing a zone" },
  { c: "tax", label: "Tax and trading" },
  { c: "us", label: "About us" },
];

export const FZ_FAQS: { c: FaqTopic; q: string; a: string }[] = [
  {
    c: "cost",
    q: "Which free zone costs the least to start?",
    a: "Our current rate card shows starting packages from AED 4,898 (Ajman Nu Venture) and AED 5,500 (Umm Al Quwain). The lowest starting price is not always the lowest total, because office size, residency and renewal costs change the picture. We compare the estimated first-year cost and the expected renewal, so you see the difference between headline price and ongoing cost.",
  },
  {
    c: "choose",
    q: "Which free zone suits my business?",
    a: "It depends on your activity, where your customers are and how many people need residency. The planner gives you a first shortlist, and your advisor confirms it.",
  },
  {
    c: "tax",
    q: "Can a free zone company sell to customers in the UAE mainland?",
    a: "Yes, but the right route depends on your activity, your customers and how you plan to operate. Options may include working through a distributor, setting up a mainland presence, or using an applicable mainland route where available. Your advisor explains the options for your business.",
  },
  {
    c: "tax",
    q: "Do free zone companies pay corporate tax?",
    a: "Some qualifying free zone businesses may benefit from 0% corporate tax on qualifying income, subject to UAE Corporate Tax rules and Qualifying Free Zone Person (QFZP) conditions. Other income may be taxed at 9%. Your advisor explains how the rules may apply to your business model.",
  },
  {
    c: "choose",
    q: "Do I need a physical office?",
    a: "Not for every setup. Every estimate we prepare includes a flexi-desk, but office requirements vary by zone, activity and package. The number of people who can hold residency is linked to office size, so we explain when an upgrade may be needed.",
  },
  {
    c: "choose",
    q: "Can I move to a different free zone later?",
    a: "It is possible, but it usually means closing one company and setting up another. Choosing the right zone at the start avoids that cost.",
  },
  {
    c: "cost",
    q: "Is the estimate a final price?",
    a: "No. It is an indicative estimate from our current rate card. Your advisor confirms the applicable package and final amount in writing.",
  },
  {
    c: "us",
    q: "Is Best Solution a government entity?",
    a: "No. Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Licences and residency approvals are issued solely by the relevant UAE authorities.",
  },
];
