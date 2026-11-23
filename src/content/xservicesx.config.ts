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
  /** "March 2026"; null hides it. */
  month: string | null;
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
  /** Street and building; the page always adds "Business Bay, Dubai". */
  officeAddress: string | null;
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
  replyTime: null,
  consultLength: null,
  planDelivery: null,
  whatsappNumber: SITE.whatsapp.replace("https://wa.me/", ""),
  phoneNumber: SITE.phone,
  email: SITE.email,
  officeAddress: null,
  officeHours: SITE.hours.long,
  mapsUrl: MAPS_URL,
  advisors: [],
  googleRating: null,
  googleReviewCount: null,
  googleReviewsUrl: SITE.googleReviews,
  // The two verified Google reviews already on /services and /freezone (content/site REVIEWS). Month and topic not
  // recorded yet, so both stay hidden; all five stars as shown on Google.
  reviews: [
    {
      topic: null,
      text: "25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands.",
      firstNameInitial: "Michael D.",
      month: null,
      stars: 5,
    },
    {
      topic: null,
      text: "Everything became structured, professional, and stress-free after switching to Best Solution.",
      firstNameInitial: "Hadi H.",
      month: null,
      stars: 5,
    },
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
