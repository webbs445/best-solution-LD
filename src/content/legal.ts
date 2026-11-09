/*
  Copied unchanged from https://www.best-solution.ae/privacy-policy/ and /terms-conditions/ on 6 Nov 2026, so pages on
  this host link to local legal pages and never out to www. Only the www site's closing marketing banner and its menu,
  header and footer were left out. Any change to the wording is a legal decision: update it on www first.
*/
export type LegalBlock = [tag: "h1" | "h2" | "h3" | "h4" | "p" | "li", text: string];

/** Switch to the site-specific drafts in content/legalV2.ts. Stays false until Best Solution's legal team signs them off. */
export const LEGAL_V2 = false;

export const LEGAL: Record<"privacy" | "terms", { blocks: LegalBlock[]; contactTitle: string; contactLine: string }> = {
  "privacy": {
    "blocks": [
      [
        "h1",
        "Privacy Policy"
      ],
      [
        "p",
        "How Best Solution Business Setup Consultancy collects, uses, shares, and protects your personal data — written in plain language, aligned with the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021)."
      ],
      [
        "p",
        "LAST UPDATED"
      ],
      [
        "p",
        "May 6, 2026"
      ],
      [
        "p",
        "DATA OFFICER"
      ],
      [
        "p",
        "Compliance Team"
      ],
      [
        "h2",
        "01. Introduction"
      ],
      [
        "p",
        "Best Solution Business Setup Consultancy (\"Best Solution\", \"we\", \"our\", or \"us\") operates the website best-solution.ae and provides UAE business setup, visa, PRO, accounting, tax, and compliance services. This Privacy Policy explains what personal data we collect, why we collect it, how we use and share it, and the rights you have over your data."
      ],
      [
        "p",
        "This policy is governed by the laws of the United Arab Emirates, in particular the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) and its Executive Regulations. Where you are accessing our services from outside the UAE, additional protections under the EU GDPR or your home jurisdiction may also apply."
      ],
      [
        "h2",
        "02. Data We Collect"
      ],
      [
        "p",
        "We only collect data that’s necessary to deliver our services, comply with UAE law, or improve our website. The categories below cover everything we may receive about you."
      ],
      [
        "h3",
        "Personal Data You Provide"
      ],
      [
        "li",
        "Full name, email, phone number"
      ],
      [
        "li",
        "Nationality, passport copy, Emirates ID"
      ],
      [
        "li",
        "Business activity, license type, jurisdiction"
      ],
      [
        "li",
        "Shareholder & director details"
      ],
      [
        "li",
        "Source of funds & KYC documents"
      ],
      [
        "li",
        "Bank statements (where required)"
      ],
      [
        "li",
        "Messages you send via forms or chat"
      ],
      [
        "h3",
        "Data We Collect Automatically"
      ],
      [
        "li",
        "IP address & approximate location (country/city)"
      ],
      [
        "li",
        "Browser type, language, device & screen size"
      ],
      [
        "li",
        "Pages visited, time on page, referrer URL"
      ],
      [
        "li",
        "UTM source, medium & campaign parameters"
      ],
      [
        "li",
        "Cookie & local-storage identifiers"
      ],
      [
        "li",
        "Diagnostic data when forms or pages fail"
      ],
      [
        "p",
        "Sensitive data: certain UAE business-setup steps require us to handle \"sensitive\" data such as passport copies, photo IDs, and source-of-funds evidence. We process these only with your consent and only to the extent required by law (KYC/AML and licensing authorities)."
      ],
      [
        "h2",
        "03. How We Use Your Data"
      ],
      [
        "p",
        "We use your data only for the purposes listed below — never for general resale."
      ],
      [
        "h4",
        "01 Deliver our services"
      ],
      [
        "p",
        "Process company formation, visa, PRO, accounting, and tax requests; submit documents to relevant UAE authorities on your behalf."
      ],
      [
        "h4",
        "02 Communicate with you"
      ],
      [
        "p",
        "Respond to enquiries, send quotes, share status updates, and confirm appointments via phone, email, WhatsApp, or SMS."
      ],
      [
        "h4",
        "03 Comply with UAE law"
      ],
      [
        "p",
        "KYC, anti-money-laundering checks, ultimate beneficial owner (UBO) reporting, and any obligations imposed by FTA, DED, free zones, GDRFA, or MOJ."
      ],
      [
        "h4",
        "04 Process payments"
      ],
      [
        "p",
        "Handle invoices, instalment plans, and refunds via our authorised payment partners (we do not store card numbers ourselves)."
      ],
      [
        "h4",
        "05 Improve the website"
      ],
      [
        "p",
        "Analyse usage to fix bugs, speed up pages, and understand which content is helpful."
      ],
      [
        "h4",
        "06 Marketing (with consent)"
      ],
      [
        "p",
        "Send you newsletters, service updates, or relevant offers — only when you’ve opted in. You can unsubscribe at any time."
      ],
      [
        "h2",
        "04. How We Share Your Data"
      ],
      [
        "p",
        "We share your data only with parties that need it to deliver your service or where the law requires it. We do not sell your data."
      ],
      [
        "p",
        "UAE government & authority partners"
      ],
      [
        "p",
        "DED, FTA, free zone authorities (DMCC, IFZA, JAFZA, etc.), GDRFA, MOFA, EIDA, MOJ, and Dubai Chamber — for license issuance, visa stamping, attestations, and tax registration. Only data required by the specific authority is shared."
      ],
      [
        "p",
        "Banking & finance partners"
      ],
      [
        "p",
        "UAE banks and finance providers when you opt in to a corporate-account introduction or 0% instalment plan. They run their own KYC and credit checks."
      ],
      [
        "p",
        "Service providers (processors)"
      ],
      [
        "p",
        "Vetted vendors that help us run the business — e.g. cloud hosting (Vercel, AWS), CRM (ERPNext), email/SMS (transactional), analytics (privacy-aware), and document storage. Each is bound by a written Data Processing Agreement."
      ],
      [
        "p",
        "Legal & regulatory disclosures"
      ],
      [
        "p",
        "Where required to comply with a court order, regulatory request, or anti-money-laundering law in the UAE."
      ],
      [
        "p",
        "With your consent"
      ],
      [
        "p",
        "For anything else (e.g. case studies, testimonials, public mentions), we ask first."
      ],
      [
        "p",
        "International transfers: some service providers (e.g. cloud hosting, email) operate servers outside the UAE. When data leaves the UAE we ensure equivalent protection through contractual safeguards and only use providers with strong security track records."
      ],
      [
        "h2",
        "05. Security & Retention"
      ],
      [
        "p",
        "We take reasonable, industry-standard steps to protect your data and we don’t hold it any longer than we need to."
      ],
      [
        "h4",
        "Security measures"
      ],
      [
        "li",
        "• HTTPS / TLS encryption on every page and form"
      ],
      [
        "li",
        "• Role-based access — only authorised staff see your file"
      ],
      [
        "li",
        "• Encrypted storage for KYC documents"
      ],
      [
        "li",
        "• Audit logs for sensitive actions"
      ],
      [
        "li",
        "• Regular security reviews of vendors and infrastructure"
      ],
      [
        "h4",
        "How long we keep data"
      ],
      [
        "li",
        "• Active client files: while engagement is active"
      ],
      [
        "li",
        "• KYC & AML records: 5 years after engagement ends (UAE law)"
      ],
      [
        "li",
        "• Tax & accounting records: 7 years (UAE FTA requirement)"
      ],
      [
        "li",
        "• Marketing leads with no engagement: 24 months, then deleted"
      ],
      [
        "li",
        "• Website analytics: 14–26 months"
      ],
      [
        "p",
        "In the event of a data breach, we will notify the UAE Data Office and any affected individuals as required by Federal Decree-Law No. 45 of 2021, normally within 72 hours of becoming aware."
      ],
      [
        "h2",
        "06. Your Rights"
      ],
      [
        "p",
        "Under the UAE Personal Data Protection Law (and the EU GDPR where it applies to you), you have the following rights. To exercise any of them, email privacy@best-solution.ae — we’ll respond within 30 days."
      ],
      [
        "h4",
        "Right to Access"
      ],
      [
        "p",
        "Get a copy of the personal data we hold about you."
      ],
      [
        "h4",
        "Right to Rectify"
      ],
      [
        "p",
        "Ask us to correct inaccurate or incomplete data."
      ],
      [
        "h4",
        "Right to Erase"
      ],
      [
        "p",
        "Ask us to delete your data, subject to legal retention rules."
      ],
      [
        "h4",
        "Data Portability"
      ],
      [
        "p",
        "Receive your data in a structured, machine-readable format or have it transferred to another provider."
      ],
      [
        "h4",
        "Right to Object"
      ],
      [
        "p",
        "Object to processing for marketing, profiling, or other listed purposes."
      ],
      [
        "h4",
        "Withdraw Consent"
      ],
      [
        "p",
        "Pull consent at any time where we relied on it (newsletters, optional cookies, etc.)."
      ],
      [
        "p",
        "If you believe we’ve mishandled your data, you can complain to the UAE Data Office (data.gov.ae). We hope you’ll come to us first so we can fix it."
      ],
      [
        "h2",
        "07. Cookies"
      ],
      [
        "p",
        "Cookies are small files saved on your device that help websites remember things between visits. We use them sparingly:"
      ],
      [
        "p",
        "Strictly necessary"
      ],
      [
        "p",
        "Session, security, and consent state. These can’t be turned off."
      ],
      [
        "p",
        "Functional"
      ],
      [
        "p",
        "Remember your preferences — language, region, and chat state — for a smoother visit. Optional."
      ],
      [
        "p",
        "Analytics"
      ],
      [
        "p",
        "Anonymous traffic counts and page-performance data. Optional."
      ],
      [
        "p",
        "Marketing"
      ],
      [
        "p",
        "Conversion tracking from ad campaigns. Optional, opt-in only."
      ],
      [
        "p",
        "We manage tags through Google Tag Manager and use Google Consent Mode, which keeps functional, analytics, and marketing cookies switched off until you opt in. Your choice is stored on your device and respected on every page."
      ],
      [
        "p",
        "You can change your choice any time via the Cookie Settings link in the footer, or via your browser settings. Disabling strictly-necessary cookies may break some site features."
      ],
      [
        "h2",
        "08. Changes to This Policy"
      ],
      [
        "p",
        "We may update this Privacy Policy from time to time — for example, when we add a new service or a UAE law changes. The \"Last updated\" date at the top of this page reflects the most recent version."
      ],
      [
        "p",
        "For material changes (anything that affects your rights or how we share data) we will notify active clients by email at least 14 days before the change takes effect."
      ]
    ],
    "contactTitle": "Contact Our Data Team",
    "contactLine": "Questions about this Privacy Policy, want to access or delete your data, or need to file a complaint? Get in touch — we usually reply within one working day."
  },
  "terms": {
    "blocks": [
      [
        "h1",
        "Terms & Conditions"
      ],
      [
        "p",
        "The terms that apply when you engage Best Solution for any service."
      ],
      [
        "p",
        "LAST UPDATED"
      ],
      [
        "p",
        "October 12, 2026"
      ],
      [
        "p",
        "GOVERNING LAW"
      ],
      [
        "p",
        "UAE / Dubai"
      ],
      [
        "h2",
        "01. Acceptance of Terms"
      ],
      [
        "p",
        "By making payment, the Client acknowledges and accepts the quotation and Best Solution’s terms and policies, without requiring a separate agreement or service contract."
      ],
      [
        "h2",
        "02. Payment Terms"
      ],
      [
        "p",
        "All payments must be made in full upfront. No credit facilities are available."
      ],
      [
        "h2",
        "03. Government Charges & Authority Decisions"
      ],
      [
        "p",
        "Government charges may change without prior notice, and any additional fees arising during processing shall be payable by the Client."
      ],
      [
        "p",
        "Best Solution is not responsible for application rejections or delays caused by government authorities."
      ],
      [
        "h2",
        "04. Client Responsibilities"
      ],
      [
        "p",
        "The Client must provide all required documents and accurate information promptly."
      ],
      [
        "p",
        "It is advisable to use email for all official communication and updates to ensure transparency and efficient service."
      ],
      [
        "h2",
        "05. Refund Policy"
      ],
      [
        "p",
        "Service charges are non-refundable once payment is received, under any circumstances."
      ],
      [
        "p",
        "Government and third-party fees are subject to the respective authority’s or provider’s refund rules."
      ],
      [
        "p",
        "Eligible refund requests must be submitted in writing within 30 calendar days."
      ],
      [
        "p",
        "Any eligible refund will be processed strictly in accordance with Best Solution’s internal refund policy."
      ],
      [
        "h2",
        "06. Appointed Service Provider"
      ],
      [
        "p",
        "The Client acknowledges and accepts Best Solution as the appointed channel partner/service provider for the full process."
      ],
      [
        "p",
        "Any request for removal or change shall be subject to Best Solution’s company policy."
      ],
      [
        "h2",
        "07. Pricing Disclaimer"
      ],
      [
        "p",
        "The following terms apply to every price, package, and quote published on the Site or shared via email/PDF."
      ],
      [
        "h4",
        "Indicative only"
      ],
      [
        "p",
        "All prices and packages displayed on the Site are starting estimates intended to help you plan. They are not a binding offer or contract until a written, signed quotation is issued by us."
      ],
      [
        "h4",
        "Currency"
      ],
      [
        "p",
        "All amounts are in UAE Dirhams (AED) unless explicitly stated otherwise."
      ],
      [
        "h4",
        "Government & authority fees"
      ],
      [
        "p",
        "A significant portion of every package is third-party government fees (DED, FTA, Free Zone authorities, GDRFA, EIDA, MOH, MOFA, Ministry of Justice, etc.). These fees are set by the respective authorities and may change without notice. Best Solution has no control over such changes and any difference will be passed through to the client at cost."
      ],
      [
        "h4",
        "Variables that affect price"
      ],
      [
        "p",
        "Final cost depends on factors including but not limited to: chosen jurisdiction (Mainland / Free Zone / Offshore), business activity and group, number of shareholders, share capital, office or flexi-desk requirement, number of visas, nationality of shareholders, attestation country, urgency, and any add-on services."
      ],
      [
        "h4",
        "What's included / not included"
      ],
      [
        "p",
        "Each package lists its specific inclusions. Unless explicitly listed, the following are NOT included: visa fees, Emirates ID, medical fitness, status change, attestation, translations, name reservation re-quote, share capital deposit, security deposits, PRO out-of-pocket, courier costs, bank account application fees, and any premium add-ons."
      ],
      [
        "h4",
        "VAT"
      ],
      [
        "p",
        "Professional service fees are subject to 5% UAE VAT where applicable. Government fees are exempt or zero-rated as per FTA rules."
      ],
      [
        "h4",
        "0% Interest Payment Plans"
      ],
      [
        "p",
        "Best Solution does not offer credit or instalment plans itself. Where applicable, such as with selected Free Zone authorities or partner banks/finance providers, we make a 0% interest payment plan available to the Client as an option. Any such plan is provided by that third party and is subject to their credit approval and eligibility criteria. Approval, tenure, and final terms are at the sole discretion of the provider."
      ],
      [
        "h4",
        "Best Price"
      ],
      [
        "p",
        "Applies only to identical, like-for-like packages from licensed UAE business setup providers and requires written proof of the competing quote within 7 days of issue."
      ],
      [
        "h4",
        "Quote validity"
      ],
      [
        "p",
        "Written quotes are valid for 30 days from issue unless otherwise stated; government fees within them are subject to authority changes during that period."
      ],
      [
        "h4",
        "Not legal or tax advice"
      ],
      [
        "p",
        "Our pricing pages provide general business setup pricing guidance only and do not constitute legal, tax, or accounting advice. We recommend a free consultation before making decisions."
      ],
      [
        "h4",
        "Right to update"
      ],
      [
        "p",
        "Best Solution reserves the right to change prices, packages, inclusions, and terms at any time without prior notice."
      ],
      [
        "h2",
        "08. Intellectual Property & Confidentiality"
      ],
      [
        "h4",
        "Our intellectual property"
      ],
      [
        "p",
        "The Site, the Best Solution brand, logos, content, design, templates, calculators, and proprietary checklists are owned by Best Solution and protected by UAE and international IP laws. Personal, non-commercial use is permitted; copying, reproducing, or republishing without our written consent is not."
      ],
      [
        "h4",
        "Confidentiality (both ways)"
      ],
      [
        "p",
        "We treat the information you share with us as confidential and only disclose it as needed to deliver your service or comply with the law (see our Privacy Policy). We expect the same — please don’t share non-public information about Best Solution’s pricing, processes, or staff outside your organisation."
      ],
      [
        "h2",
        "09. Limitation of Liability"
      ],
      [
        "p",
        "We’ll always do our work professionally and on time. Realistically though, some things are outside our control, so:"
      ],
      [
        "p",
        "Government delays: we’re not liable for processing delays caused by DED, FTA, free zones, banks, immigration, ministries, embassies, or any other authority."
      ],
      [
        "p",
        "Indirect losses: Best Solution is not liable for indirect, consequential, or special losses (e.g. lost profits, lost opportunity, business interruption)."
      ],
      [
        "p",
        "Cap on liability: our total aggregate liability for any single engagement is limited to the service fees you actually paid us for that engagement."
      ],
      [
        "p",
        "Force majeure: neither party is liable for delays or non-performance caused by events outside reasonable control (natural disaster, war, internet outage, regulatory shutdown, pandemic, etc.)."
      ],
      [
        "p",
        "Nothing in these Terms limits liability that cannot lawfully be limited under UAE law (e.g. fraud, gross negligence, willful misconduct)."
      ],
      [
        "h2",
        "10. Governing Law & Disputes"
      ],
      [
        "p",
        "These Terms are governed by the laws of the United Arab Emirates as applicable in the Emirate of Dubai. Any dispute arising from these Terms or our services shall be settled as follows:"
      ],
      [
        "li",
        "Good-faith negotiation — we’ll try to resolve any issue directly within 30 days."
      ],
      [
        "li",
        "Mediation — if that doesn’t work, the parties may attempt mediation through a Dubai-based mediator."
      ],
      [
        "li",
        "Courts of Dubai — failing the above, the Courts of Dubai have exclusive jurisdiction."
      ]
    ],
    "contactTitle": "Questions About These Terms?",
    "contactLine": "Get in touch — we usually reply within one working day."
  }
};
