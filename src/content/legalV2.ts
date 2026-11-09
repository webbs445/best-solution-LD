/*
  Site-specific legal drafts for business.best-solution.ae (Nov 2026), written for this host only: advice
  consultations, consultation forms, cookies after consent, and ad measurement. Not live until the LEGAL_V2 flag in
  content/legal.ts is switched on after Best Solution's legal approval. Same block format as LEGAL.
  docs/legal/*.md are generated from this file (scripts/legal-md.mjs): edit here, then regenerate.
*/
export type LegalV2Block = [tag: "h1" | "h2" | "p" | "li", text: string];
export const LEGAL_V2_UPDATED = "9 November 2026";

export const LEGAL_V2_DRAFT: Record<"privacy" | "terms", { blocks: LegalV2Block[]; contactTitle: string; contactLine: string }> = {
  privacy: {
    blocks: [
      ["h1", "Privacy Policy"],
      ["p", `Last updated: ${LEGAL_V2_UPDATED}`],
      ["h2", "1. Who we are"],
      [
        "p",
        'This policy covers the website business.best-solution.ae. The site is run by Best Solution, a private business consultancy in Business Bay, Dubai ("Best Solution", "we", "us"). We are not a government entity.',
      ],
      ["p", "If you have a question about your personal data, email connect@best-solution.ae."],

      ["h2", "2. What we collect"],
      ["p", "When you fill in a consultation or callback form on this site, we collect:"],
      ["li", "your name, phone number and email address;"],
      ["li", "the topic of your enquiry and any message you write;"],
      ["li", "any short answers you give about your plans in the form (for example your type of business or the support you need)."],
      ["p", "When you arrive from an online ad, the link can carry a click ID (gclid, gbraid or wbraid) and campaign values (UTM tags). If you send a form, we keep these with your enquiry so we know which ad it came from."],
      ["p", "Only if you accept cookies, analytics and advertising tags from Google Analytics 4, Google Ads, Microsoft Clarity and Meta record how the site is used and whether a visit came from an ad. See section 3."],
      ["p", "We do not ask for identity papers, payment card details or other sensitive data on this site."],

      ["h2", "3. Cookies and your consent"],
      ["p", "When you first visit, a cookie banner asks for your choice: Reject all, Accept all, or Manage preferences (Analytics and Marketing). Until you choose, no analytics or advertising tag runs. We use Google Consent Mode so Google's tags follow your choice."],
      ["p", "We store your choice on your device so we do not ask again. You can change it at any time with the Cookie Settings link at the bottom of every page."],

      ["h2", "4. Why we use your data"],
      ["li", "To reply to your enquiry and arrange your consultation, by phone, WhatsApp or email. The basis is your request."],
      ["li", "To measure our advertising: which ads lead to enquiries. This includes sending the click ID, the time of your enquiry and our enquiry reference back to Google Ads. The basis is your consent where cookies are involved, and our interest in knowing which ads work."],
      ["li", "To keep the site secure and working."],
      ["p", "We do not sell your personal data."],

      ["h2", "5. Who we share it with"],
      ["li", "Our customer records system (ERPNext) and our internal lead sheet (Google Sheets), used only by our team to handle enquiries."],
      ["li", "Google (Analytics and Ads), Microsoft (Clarity) and Meta, only after your consent and only as described above."],
      ["li", "Our website hosting provider (Vercel), which processes requests to run the site."],
      ["li", "Authorities, only where UAE law requires it."],
      ["p", "Some of these providers may store data outside the UAE. We only use providers that protect personal data under their own published terms."],

      ["h2", "6. How long we keep it"],
      ["p", "We keep enquiry details only as long as we need them to reply to you and follow up, and after that only as long as UAE law requires. Analytics data is kept for the period set in each tool."],

      ["h2", "7. Your rights"],
      ["p", "Under the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) you can ask us to:"],
      ["li", "give you a copy of the personal data we hold about you;"],
      ["li", "correct data that is wrong;"],
      ["li", "delete your data;"],
      ["li", "stop using your data where you gave consent (withdrawing consent does not affect use before you withdrew it)."],
      ["p", "Email connect@best-solution.ae. We may ask you to confirm who you are before we act. We aim to reply within 30 days."],

      ["h2", "8. Security"],
      ["p", "Only staff who handle enquiries can see your details. The site uses an encrypted connection (HTTPS)."],

      ["h2", "9. Changes to this policy"],
      ["p", "If we change this policy, we will update the date at the top of this page."],
    ],
    contactTitle: "Contact us",
    contactLine: "Questions about this policy or your personal data? Email us and we will reply as soon as we can.",
  },

  terms: {
    blocks: [
      ["h1", "Terms of Use"],
      ["p", `Last updated: ${LEGAL_V2_UPDATED}`],
      ["h2", "1. About this site"],
      [
        "p",
        'business.best-solution.ae is run by Best Solution, a private business consultancy in Business Bay, Dubai ("Best Solution", "we", "us"). The site describes our advisory services and lets you ask for a consultation. By using the site, you agree to these terms.',
      ],
      ["p", "We are not a government entity and do not act on behalf of any government authority. Official decisions are made only by the relevant UAE authorities."],

      ["h2", "2. General information only"],
      ["p", "The information on this site is general. It is not legal, tax or accounting advice, and it may not fit your situation. Planners, estimators and examples on the site are illustrations only. Talk to an advisor before you make a decision."],

      ["h2", "3. No prices or offers on this site"],
      ["p", "This site does not show prices or packages and does not make price offers. We do not offer price matching. If you ask us for paid work, any fees are agreed with you directly before the work begins."],

      ["h2", "4. Consultations"],
      ["p", "Asking for or having a consultation does not create any obligation for you to buy anything. Any paid work is agreed separately, in an engagement you accept."],

      ["h2", "5. Using the site"],
      ["li", "Give accurate details when you send a form."],
      ["li", "Do not misuse the site, try to break its security, or send unlawful or harmful content."],
      ["li", "Do not copy the site's content or design for commercial use without our written consent."],

      ["h2", "6. Links to other services"],
      ["p", "The site links to services we do not control, such as WhatsApp and Google reviews. Their own terms and privacy policies apply."],

      ["h2", "7. Liability"],
      ["p", "We take care to keep the site accurate, but we cannot promise it is complete or always available. To the extent the law allows, we are not liable for loss caused by relying on the site's general information alone."],

      ["h2", "8. Privacy"],
      ["p", "How we handle your personal data is explained in our Privacy Policy."],

      ["h2", "9. Changes to these terms"],
      ["p", "We may update these terms. The date at the top of this page shows the latest version."],

      ["h2", "10. Governing law"],
      ["p", "These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai. The courts of Dubai have jurisdiction over any dispute."],
    ],
    contactTitle: "Questions about these terms?",
    contactLine: "Email us and we will reply as soon as we can.",
  },
};
