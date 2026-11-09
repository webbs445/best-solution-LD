/* ============================================================
   /freezone page content: zone names, emirates, activity groups and copy. No prices: this file ships to the
   browser. The rate card the /api/lead planner route still uses lives server-side in lib/freezone.ts.
   ============================================================ */

import ACTIVITY_ICONS from "./activity-icons.json";

export type Emirate = "Dubai" | "Abu Dhabi" | "Sharjah" | "Northern Emirates";

/** Business types on the zone tags. */
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
export type ZoneGroup = "dubai" | "sector" | "trade" | "finance";

export interface Zone {
  id: string;
  name: string;
  emirate: Emirate;
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
}

const z = (id: string, name: string, emirate: Emirate, d: string, t: ActKey[], g: ZoneGroup[], sect: SectorKey[], short: [string, string]): Zone => ({
  id,
  name,
  emirate,
  d,
  t,
  g,
  sect,
  short,
});

export const ZONES: Zone[] = [
  z("f0", "IFZA (Dubai)", "Dubai", "A wide activity range across services, trading and e-commerce",
    ["services", "trading", "ecommerce", "tech"], ["dubai"],
    ["trading", "general", "services", "ecommerce", "media", "tech", "education", "food", "tourism", "holding", "logistics", "events", "realestate"],
    ["IFZA", "IFZA"]),
  z("f1", "Meydan Free Zone", "Dubai", "Central Dubai address for e-commerce and consultancy",
    ["ecommerce", "services"], ["dubai"],
    ["trading", "general", "services", "ecommerce", "media", "tech", "education", "food", "tourism", "holding", "logistics", "events", "crypto", "realestate"],
    ["Meydan", "MFZ"]),
  z("f2", "DMCC", "Dubai", "Commodities and trade hub in Jumeirah Lakes Towers",
    ["trading", "services", "tech"], ["dubai", "trade"],
    ["trading", "general", "services", "ecommerce", "tech", "commodities", "crypto", "food", "holding", "education", "media", "logistics", "industrial", "events"],
    ["DMCC", "DMCC"]),
  z("f3", "JAFZA (Jebel Ali)", "Dubai", "Trading, logistics and industry with port access",
    ["trading", "logistics"], ["dubai", "trade"],
    ["trading", "general", "logistics", "industrial", "auto", "food", "holding", "services", "ecommerce", "commodities"],
    ["JAFZA", "JAFZA"]),
  z("f4", "Dubai Silicon Oasis / DIEZ", "Dubai", "Technology, trading and services in an integrated zone",
    ["tech", "trading", "services"], ["dubai"],
    ["tech", "trading", "general", "services", "ecommerce", "education", "industrial", "holding", "media"],
    ["Silicon Oasis", "DSO"]),
  z("f5", "Dubai Internet City", "Dubai", "Technology and IT companies",
    ["tech"], ["dubai", "sector"],
    ["tech", "ecommerce", "services", "media"],
    ["Internet City", "DIC"]),
  z("f6", "Dubai Media City", "Dubai", "Media, marketing and creative businesses",
    ["media"], ["dubai", "sector"],
    ["media", "services", "events", "tech"],
    ["Media City", "DMC"]),
  z("f7", "Dubai Airport Free Zone (DAFZA)", "Dubai", "Aviation, logistics and high-value trade",
    ["trading", "logistics"], ["dubai", "trade"],
    ["trading", "general", "logistics", "services", "tech", "ecommerce", "commodities", "holding", "health"],
    ["DAFZA", "DAFZA"]),
  z("f8", "Dubai South (DWC)", "Dubai", "Logistics, aviation and e-commerce",
    ["logistics", "ecommerce"], ["dubai", "trade"],
    ["logistics", "trading", "general", "ecommerce", "services", "industrial", "auto", "events"],
    ["Dubai South", "DWC"]),
  z("f9", "Dubai Healthcare City", "Dubai", "Clinical and allied health businesses",
    ["health"], ["dubai", "sector"],
    ["health", "education", "services"],
    ["Healthcare City", "DHCC"]),
  z("f10", "DIFC", "Dubai", "Financial services and holding companies, common law",
    ["finance"], ["dubai", "finance"],
    ["finance", "holding", "services", "crypto", "tech"],
    ["DIFC", "DIFC"]),
  z("f11", "Dubai CommerCity", "Dubai", "A free zone dedicated to e-commerce",
    ["ecommerce"], ["dubai", "sector"],
    ["ecommerce", "logistics", "trading", "tech"],
    ["CommerCity", "DCC"]),
  z("f12", "ADGM", "Abu Dhabi", "International financial centre in Abu Dhabi, common law",
    ["finance"], ["finance"],
    ["finance", "holding", "services", "crypto", "tech"],
    ["ADGM", "ADGM"]),
  z("f13", "KEZAD", "Abu Dhabi", "Industrial, logistics and trading in Abu Dhabi",
    ["logistics", "trading"], ["trade"],
    ["industrial", "logistics", "trading", "general", "food", "auto", "commodities"],
    ["KEZAD", "KEZAD"]),
  z("f14", "Masdar City Free Zone", "Abu Dhabi", "Clean technology, renewable energy and innovation",
    ["tech"], ["sector"],
    ["tech", "services", "education", "industrial", "holding", "trading"],
    ["Masdar City", "MCFZ"]),
  z("f15", "SHAMS (Sharjah Media City)", "Sharjah", "Media, creative and service businesses",
    ["media", "services", "ecommerce"], [],
    ["media", "services", "ecommerce", "tech", "trading", "general", "education", "food", "tourism", "holding", "events"],
    ["SHAMS", "SHAMS"]),
  z("f16", "SAIF Zone", "Sharjah", "Airport-linked trading, logistics and light industry",
    ["trading", "logistics"], ["trade"],
    ["trading", "general", "logistics", "industrial", "services", "auto", "food", "ecommerce", "holding"],
    ["SAIF Zone", "SAIF"]),
  z("f17", "Hamriyah Free Zone (HFZA)", "Sharjah", "Industrial, manufacturing and trading with port access",
    ["logistics", "trading"], ["trade"],
    ["industrial", "trading", "general", "logistics", "commodities", "food", "auto"],
    ["Hamriyah", "HFZA"]),
  z("f18", "SPC Free Zone", "Sharjah", "Publishing, media and a broad list of activities",
    ["media", "services", "ecommerce"], [],
    ["media", "services", "ecommerce", "tech", "trading", "general", "education", "food", "tourism", "holding", "events"],
    ["SPC", "SPC"]),
  z("f19", "SRTIP", "Sharjah", "Research, technology and innovation in Sharjah",
    ["tech"], ["sector"],
    ["tech", "services", "education", "industrial", "health"],
    ["SRTIP", "SRTIP"]),
  z("f20", "Ajman Free Zone (AFZ)", "Northern Emirates", "Trading, services and industrial activities",
    ["trading", "services", "logistics"], [],
    ["trading", "general", "services", "industrial", "ecommerce", "media", "tech", "food", "logistics", "auto", "holding", "tourism", "events"],
    ["Ajman FZ", "AFZ"]),
  z("f21", "Ajman Nu Venture Free Zone", "Northern Emirates", "Media and service businesses",
    ["media", "services"], [],
    ["services", "media", "ecommerce", "tech", "trading", "general", "education", "food", "tourism", "holding", "events"],
    ["Nu Venture", "ANV"]),
  z("f22", "RAKEZ", "Northern Emirates", "Trading, services and industrial in Ras Al Khaimah",
    ["trading", "services", "logistics", "ecommerce"], [],
    ["trading", "general", "services", "industrial", "ecommerce", "media", "tech", "education", "food", "logistics", "holding", "tourism", "auto", "events"],
    ["RAKEZ", "RAKEZ"]),
  z("f23", "RAK Maritime City", "Northern Emirates", "Maritime, industrial and trading activities",
    ["logistics", "trading"], ["trade"],
    ["logistics", "industrial", "trading"],
    ["RAK Maritime", "RAKMC"]),
  z("f24", "Innovation City", "Northern Emirates", "Digital assets and Web3 companies",
    ["tech"], ["sector"],
    ["crypto", "tech", "services", "holding"],
    ["Innovation City", "IC"]),
  z("f25", "Fujairah Free Zone (FFZ)", "Northern Emirates", "Trading, logistics and industry on the east coast",
    ["trading", "logistics"], ["trade"],
    ["trading", "general", "logistics", "industrial", "commodities", "auto", "food"],
    ["Fujairah FZ", "FFZ"]),
  z("f26", "Creative City Fujairah", "Northern Emirates", "Media, consultancy and service businesses",
    ["media", "services"], [],
    ["media", "services", "ecommerce", "tech", "trading", "education", "events", "holding"],
    ["Creative City", "CCF"]),
  z("f27", "Umm Al Quwain (UAQ FTZ)", "Northern Emirates", "Trading, services and micro-businesses",
    ["trading", "services"], [],
    ["trading", "general", "services", "ecommerce", "media", "tech", "industrial", "food", "logistics", "holding", "tourism", "events"],
    ["UAQ FTZ", "UAQ"]),
];

export const ZONE_BY_ID: Record<string, Zone> = Object.fromEntries(ZONES.map((zn) => [zn.id, zn]));

export const EMIRATES: Emirate[] = ["Dubai", "Abu Dhabi", "Sharjah", "Northern Emirates"];

export const EM_SHORT: Record<Emirate, string> = {
  Dubai: "Dubai",
  "Abu Dhabi": "Abu Dhabi",
  Sharjah: "Sharjah",
  "Northern Emirates": "Northern",
};

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

/** A searchable business activity: [name, sector, synonyms]. */
export type Activity = [name: string, sector: SectorKey, synonyms: string];

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
  ["Pharmaceutical trading", "health", "medicines drugs pharma"],
  ["Toys and games trading", "trading", "kids toys games"],
  ["Jewellery trading", "commodities", "jewelry jewellery gold ornaments"],
  ["Gold and precious metals trading", "commodities", "gold silver bullion precious metals"],
  ["Diamond trading", "commodities", "diamonds gemstones precious stones"],
  ["Oil and petroleum products trading", "commodities", "oil petroleum lubricants fuel energy"],
  ["Metals and scrap trading", "commodities", "steel aluminium copper scrap metal"],
  ["Coffee and tea trading", "food", "coffee beans tea"],
  ["Foodstuff trading", "food", "food trading groceries packaged food rice spices"],
  ["Fruits and vegetables trading", "food", "fresh produce fruit vegetables"],
  ["Restaurant or cafe", "food", "restaurant cafe coffee shop cloud kitchen catering"],
  ["Catering services", "food", "catering events food service"],
  ["Cloud kitchen", "food", "delivery kitchen dark kitchen"],
  ["Agricultural products trading", "food", "agriculture seeds fertiliser animal feed"],
  ["Management consultancy", "services", "consultant consulting business advisory strategy"],
  ["Business consultancy", "services", "consultant consulting business setup advisory"],
  ["IT consultancy", "tech", "it consulting technology consultant"],
  ["HR consultancy", "services", "human resources hr consultant"],
  ["Recruitment and staffing", "services", "recruitment manpower staffing headhunting"],
  ["Marketing consultancy", "media", "marketing consultant strategy brand"],
  ["Digital marketing agency", "media", "digital marketing seo sem ppc google ads agency"],
  ["Social media management", "media", "social media instagram tiktok influencer management"],
  ["Advertising agency", "media", "advertising ads agency campaign"],
  ["Public relations", "media", "pr communications press"],
  ["Branding and graphic design", "media", "design graphic designer logo branding creative"],
  ["Video and film production", "media", "video production film photography studio"],
  ["Photography services", "media", "photographer photo studio"],
  ["Content creation and influencer", "media", "content creator influencer youtuber blogger"],
  ["Publishing", "media", "books magazine publisher printing"],
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
  ["Fintech", "finance", "fintech payments financial technology"],
  ["Crypto and blockchain services", "crypto", "crypto cryptocurrency blockchain web3 nft token dao"],
  ["Virtual asset trading", "crypto", "crypto trading bitcoin virtual assets exchange"],
  ["Web3 and NFT projects", "crypto", "web3 nft metaverse dao defi"],
  ["E-commerce store", "ecommerce", "online store online shop ecommerce shopify website selling"],
  ["Amazon and marketplace seller", "ecommerce", "amazon noon marketplace seller online selling fba"],
  ["Dropshipping", "ecommerce", "dropshipping online store"],
  ["Online education platform", "education", "e-learning online courses edtech"],
  ["Training and coaching", "education", "training courses coaching workshops"],
  ["Educational consultancy", "education", "education consultant student admissions"],
  ["Language institute", "education", "language courses tutoring"],
  ["Freight forwarding", "logistics", "freight forwarder cargo shipping air freight sea freight"],
  ["Logistics services", "logistics", "logistics supply chain transport"],
  ["Warehousing and storage", "logistics", "warehouse storage fulfilment 3pl"],
  ["Courier and delivery", "logistics", "courier delivery last mile parcels"],
  ["Shipping and ship management", "logistics", "shipping ship management maritime vessel marine"],
  ["Marine services", "logistics", "marine ship chandlers boats yacht"],
  ["Manufacturing", "industrial", "manufacturing factory production assembly"],
  ["Food processing", "industrial", "food factory processing packaging"],
  ["Packaging manufacturing", "industrial", "packaging boxes plastic"],
  ["Garment manufacturing", "industrial", "clothing factory tailoring"],
  ["Steel fabrication", "industrial", "fabrication metal works welding"],
  ["Chemical products", "industrial", "chemicals paints coatings"],
  ["3D printing", "industrial", "3d printing additive manufacturing"],
  ["Renewable energy", "industrial", "solar energy renewables clean tech cleantech"],
  ["Medical clinic", "health", "clinic doctor medical centre"],
  ["Healthcare consultancy", "health", "healthcare consultant medical consulting"],
  ["Wellness and fitness", "health", "fitness gym wellness yoga spa"],
  ["Medical tourism", "health", "medical tourism patients"],
  ["Holding company", "holding", "holding company asset holding investments"],
  ["Investment company", "holding", "investment portfolio private investment"],
  ["Family office", "holding", "family office wealth"],
  ["Financial advisory", "finance", "financial advisor wealth management"],
  ["Asset management", "finance", "fund management asset manager"],
  ["Insurance brokerage", "finance", "insurance broker"],
  ["Accounting and bookkeeping", "services", "accountant accounting bookkeeping"],
  ["Auditing", "services", "audit auditor"],
  ["Tax consultancy", "services", "tax consultant vat corporate tax"],
  ["Legal consultancy", "services", "legal consultant lawyer advisory"],
  ["Translation services", "services", "translator translation interpretation"],
  ["Architecture and interior design", "services", "architect interior designer fit out"],
  ["Engineering consultancy", "services", "engineer engineering consultant"],
  ["Real estate brokerage", "realestate", "property broker real estate agent"],
  ["Property management", "realestate", "property manager facilities"],
  ["Real estate consultancy", "realestate", "property consultant real estate advisory"],
  ["Travel agency", "tourism", "travel agent tickets holidays"],
  ["Tour operator", "tourism", "tours tourism desert safari"],
  ["Car rental", "auto", "car rental rent a car vehicle leasing"],
  ["Cleaning services", "services", "cleaning facility management"],
  ["Security consultancy", "services", "security consultant"],
  ["Beauty salon", "services", "salon beauty hair nails"],
  ["Pet services", "services", "pets grooming pet shop"],
  ["Freelancer", "services", "freelance freelancer self employed individual"],
  ["Aviation services", "logistics", "aviation aircraft aerospace"],
  ["Research and development", "tech", "research r&d innovation lab"],
  ["Biotechnology", "health", "biotech life sciences research"],
];

export const POPULAR_ACTS = [
  "General trading",
  "Management consultancy",
  "E-commerce store",
  "Digital marketing agency",
  "Software development",
  "Real estate brokerage",
];

/* Lucide icon bodies for the activity search, keyed by activity name. */
const ICONS = ACTIVITY_ICONS as { map: Record<string, string>; icons: Record<string, string> };

/** The inner SVG markup of an activity's icon (static Lucide paths from our own content file). */
export function activityIcon(name: string): string {
  return ICONS.icons[ICONS.map[name]] || ICONS.icons["briefcase-business"];
}

/* The planner's "What will you do?" choices (lib/zoneSearch ranks the zones by them). No prices. */
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

/* The planner's "What matters most?" choices. None is about price (no prices on this page). */
export type Priority = "range" | "dubai" | "sector";

export const PRIORITIES: { v: Priority; label: string }[] = [
  { v: "range", label: "Wide activity range" },
  { v: "dubai", label: "Dubai address" },
  { v: "sector", label: "Specialist zone" },
];

/* Hero card: an activity and a zone often suited to it. */
export const HERO_DEMO: [ActKey, string][] = [
  ["ecommerce", "f1"],
  ["tech", "f5"],
  ["trading", "f22"],
  ["media", "f15"],
  ["services", "f0"],
  ["logistics", "f8"],
  ["finance", "f10"],
];

/* Workspace types we explain for every zone (plain text, no prices). */
export const OFFICE_TYPES = ["Flexi-desk", "Shared or serviced office", "Private office", "Warehouse or industrial unit"];

/* Questions worth asking about any zone you are considering. */
export const ZONE_QUESTIONS = [
  "Does this zone cover my exact business activity?",
  "Which workspace type suits my team and customers?",
  "What yearly running costs should I plan for?",
  "Can I serve UAE mainland customers from here?",
];

/* Google Ads sitelink routes: /freezone/<view> serves this page and scrolls to the matching section (FzSitelink). */
export const FZ_SITELINK_VIEWS = ["planner", "compare", "activity", "budget", "vs-mainland", "consultation", "dubai"] as const;
export type FzSitelinkView = (typeof FZ_SITELINK_VIEWS)[number];

/* On-page navigation (header, mobile menu and footer). */
export const FZ_NAV = [
  { href: "#planner", label: "Planner" },
  { href: "#zones", label: "Zones" },
  { href: "#process", label: "Steps" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export type FaqTopic = "cost" | "choose" | "tax" | "us";

export const FZ_FAQ_TOPICS: { c: FaqTopic | "all"; label: string }[] = [
  { c: "all", label: "All" },
  { c: "cost", label: "Budget" },
  { c: "choose", label: "Choosing a zone" },
  { c: "tax", label: "Tax and trading" },
  { c: "us", label: "About us" },
];

export const FZ_FAQS: { c: FaqTopic; q: string; a: string }[] = [
  {
    c: "cost",
    q: "What should I plan for in my budget?",
    a: "Running costs differ from zone to zone. They depend on your activity, the type of workspace, the size of your team and yearly items such as bookkeeping. Your advisor walks you through what to plan for in each zone you are considering.",
  },
  {
    c: "choose",
    q: "Which free zone suits my business?",
    a: "It depends on your activity, where your customers are and the workspace you need. Your advisor compares suitable zones with you and explains the differences.",
  },
  {
    c: "tax",
    q: "Can a free zone company sell to customers in the UAE mainland?",
    a: "It depends on your activity, your customers and how you plan to operate. Options may include working through a distributor, a mainland presence, or another route where the rules allow it. Your advisor explains the options that may apply to you.",
  },
  {
    c: "us",
    q: "What does a consultation cover?",
    a: "Your advisor reviews your activity, customers and team, compares suitable zones with you and answers your questions. There is no obligation to proceed.",
  },
  {
    c: "us",
    q: "Is Best Solution a government entity?",
    a: "No. Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Official decisions are made only by the relevant UAE authorities.",
  },
];
