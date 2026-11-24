import { MAPS_URL, SITE } from "@/content/site";
import { XS_FIXTURES } from "@/content/xservicesx.fixtures";

/*
  /xservicesx facts. Every [bracket] in the design (design/xservicesx) comes from here. null (or an empty list) means
  not confirmed yet: the element that needs it is left out of the page, never shown with a placeholder. Fill a value
  only once Best Solution confirms it. Reviews are copied word for word from Google; never write, edit or merge one.
*/

export type TopicId = "new_company" | "fz_or_mainland" | "holding" | "bookkeeping" | "corporate_tax" | "not_sure";

export interface Advisor {
  id: string;
  name: string;
  role: string;
  languages: string;
  /** Short line under the name on a closed panel, e.g. "New companies". */
  focusLabel: string;
  topics: string[];
  /** One line in their own words. */
  quote: string;
  /** Path under /public. Same crop and background for every advisor. null shows the silhouette. */
  photo: string | null;
}

export interface Review {
  /** The topic tab it belongs to; null puts it in the general list (no tabs until reviews have topics). */
  topic: TopicId | null;
  /** Word for word from Google. */
  text: string;
  /** "Michael D." */
  firstNameInitial: string;
  /** Star rating on Google; null hides the stars. */
  stars: number | null;
  advisorId?: string;
}

export const XS_CONFIG: {
  replyTime: string | null;
  consultLength: string | null;
  planDelivery: string | null;
  whatsappNumber: string;
  phoneNumber: { display: string; href: string };
  email: string;
  /** The full office address as shown (office card, footer, JSON-LD); null shows "Business Bay, Dubai". */
  officeAddress: string | null;
  /** "English, Arabic, ..."; null hides the languages question. */
  teamLanguages: string | null;
  officeHours: string | null;
  mapsUrl: string;
  advisors: Advisor[];
  googleRating: number | null;
  googleReviewCount: number | null;
  googleReviewsUrl: string | null;
  reviews: Review[];
  clientStory: { businessType: string; country: string; cameIn: string; leftWith: string; url: string | null } | null;
  servicePages: Record<Exclude<TopicId, "not_sure">, string>;
  /** About page for the footer's Company list; null hides the link. */
  aboutUrl: string | null;
  /** Switches on every "fees in writing" line (CLAIMS.writtenQuote on the rest of the site). */
  feesInWritingConfirmed: boolean;
  privacyUrl: string;
  termsUrl: string;
} = applyFixture({
  // Read as "replies the same day", "calls you the same day, in office hours".
  replyTime: "the same day",
  consultLength: null,
  planDelivery: null,
  whatsappNumber: SITE.whatsapp.replace("https://wa.me/", ""),
  phoneNumber: SITE.phone,
  email: SITE.email,
  officeAddress: "Office 906, Capital Golden Tower, Business Bay, Dubai",
  teamLanguages: null,
  officeHours: SITE.hours.long,
  mapsUrl: MAPS_URL,
  advisors: [],
  // Verified on Google Maps (Best Solution Business Setup Consultancy, Business Bay).
  googleRating: 4.8,
  googleReviewCount: 225,
  googleReviewsUrl: MAPS_URL,
  // Google reviews, word for word (Bibin's list of 13, in his order). Copy scans exempt only "stress-free" and the brand
  // name "best solution" (any case). No review may name Yasmin / Yasmine / Jasmine (servicesPlan.test.ts checks it).
  reviews: [
    { topic: null, firstNameInitial: "Michael D.", stars: 5, text: "25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands." },
    { topic: null, firstNameInitial: "Hadi H.", stars: 5, text: "Everything became structured, professional, and stress-free after switching to Best Solution." },
    { topic: null, firstNameInitial: "Uchenna I.", stars: 5, text: "We have had several excellent experiences with Best Solution. Their team is highly professional, reliable, and committed to delivering quality services. They provide outstanding services, always understand our requirements clearly, and offer effective services in a timely manner. We truly appreciate their dedication, excellent services, and attention to detail. We highly recommend Best Solution to anyone looking for trusted and professional services. Keep up the great work!" },
    { topic: null, firstNameInitial: "Ahmed S.", stars: 5, text: "Wonderful Supportive, close follow up and doing things in a right way." },
    { topic: null, firstNameInitial: "R. F.", stars: 5, text: "Hello I want to thank you for all of your company's services.It was wonderful and your staff was amazing specially Mr Vipin." },
    { topic: null, firstNameInitial: "Ali R.", stars: 5, text: "Highly appreciate their efforts for the quality of services they are providing. Special thanks to Mr.vipin and their team for keeping up the excellent work." },
    { topic: null, firstNameInitial: "Vesela H.", stars: 5, text: "I work with them since 3 years and I highly recommend them! Professional and trustworthy team! I'm giving 10 stars excellent service ⭐️" },
    { topic: null, firstNameInitial: "D. K.", stars: 5, text: "Customer service is responsive and highly recommended.." },
    { topic: null, firstNameInitial: "Erguvan", stars: 5, text: "Best Solution Business Consultancy is the right partner. We are happy with their follow-ups and escalations. Having a dedicated person assigned to us makes everything better." },
    { topic: null, firstNameInitial: "Tenco Homes", stars: 5, text: "Absolutely brilliant service, the team are very well knowledgeable and live up to the name it is most definitely the \"best solution\" I thank the team and look forward to using you again in the future! Amazing service and solutions Mr Ahmed is a diamond" },
    { topic: null, firstNameInitial: "Nurul A.", stars: 5, text: "Thank you very much for your success and we are very pleased to have completed everything in the shortest possible time. Your service is top notch." },
    { topic: null, firstNameInitial: "Ismael M.", stars: 5, text: "A very respectable company in its dealings, especially with Mr. Samir, who is very elegant in his treatment of customers and keen on satisfying the client as much as possible." },
    { topic: null, firstNameInitial: "Mourad H.", stars: 5, text: "we had a great experience! professionalism at the top speed excellent service we highly recommend" },
  ],
  clientStory: null,
  servicePages: {
    new_company: "/cost-calculator",
    fz_or_mainland: "/freezone",
    holding: "/spv",
    bookkeeping: "/accounting",
    corporate_tax: "/corporate-tax",
  },
  aboutUrl: null,
  feesInWritingConfirmed: false,
  privacyUrl: SITE.privacy,
  termsUrl: SITE.terms,
});

/** Local QA builds only: NEXT_PUBLIC_XS_FIXTURE swaps in test advisors and reviews (content/xservicesx.fixtures). */
function applyFixture<T extends object>(config: T): T {
  const name = process.env.NEXT_PUBLIC_XS_FIXTURE;
  const fixture = name ? XS_FIXTURES[name] : undefined;
  return fixture ? { ...config, ...fixture } : config;
}
