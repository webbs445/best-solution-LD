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
  // Google reviews, word for word (Bibin's list, in his order). Copy scans exempt only "stress-free" and "THE BEST SOLUTIONS".
  reviews: [
    { topic: null, firstNameInitial: "Michael D.", stars: 5, text: "25+ years in banking and corporate services, and Best Solution truly stands apart. From day one, I knew I was in safe hands." },
    { topic: null, firstNameInitial: "Hadi H.", stars: 5, text: "Everything became structured, professional, and stress-free after switching to Best Solution." },
    { topic: null, firstNameInitial: "Alex T.", stars: 5, text: "Amazing easy process experience highly recommended makes everything super simple and explainable they do everything for you specially Yasmin she is very knowledgeable of everything and makes you comfortable and makes you understand and her hospitality is five star" },
    { topic: null, firstNameInitial: "Waleed B.", stars: 5, text: "The service from the team has been excellent. Yasmine and the whole team is honest, efficient and helps with all business requirements. My experience with them has been smooth and without any issues. Highly recommended." },
    { topic: null, firstNameInitial: "Ahmed S.", stars: 5, text: "Wonderful Supportive, close follow up and doing things in a right way." },
    { topic: null, firstNameInitial: "Spiros E.", stars: 5, text: "Great team and communication. Special thanks to Jasmine for handling everything smoothly." },
    { topic: null, firstNameInitial: "R. F.", stars: 5, text: "Hello I want to thank you for all of your company’s services.It was wonderful and your staff was amazing specially Mr Vipin." },
    { topic: null, firstNameInitial: "Souhail E.", stars: 5, text: "Yasmine did a great job and was available throughout all the process even when I had some special requirements. Many thanks to all the team!" },
    { topic: null, firstNameInitial: "Vesela H.", stars: 5, text: "I work with them since 3 years and I highly recommend them! Professional and trustworthy team! I’m giving 10 stars excellent service ⭐️" },
    { topic: null, firstNameInitial: "Ali R.", stars: 5, text: "Highly appreciate their efforts for the quality of services they are providing. Special thanks to Mr.vipin and their team for keeping up the excellent work." },
    { topic: null, firstNameInitial: "Santiago B.", stars: 5, text: "Yasmine is very nice and efficient. The Best Solution group is highly recommended and very professional." },
    { topic: null, firstNameInitial: "Dominique K.", stars: 5, text: "Thank you to the entire team, and especially to Yasmine, who dedicates countless hours to satisfying clients. She is always kind and committed to finding “THE BEST SOLUTIONS” with professionalism. Thank you again, and see you soon for new business ventures." },
    { topic: null, firstNameInitial: "Sarim A.", stars: 5, text: "Very professional and honest. It was a pleasure dealing with Yasmine. Thank you." },
    { topic: null, firstNameInitial: "D. K.", stars: 5, text: "Customer service is responsive and highly recommended.." },
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
