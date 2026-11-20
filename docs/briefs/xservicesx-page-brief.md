# /xservicesx page brief (Services page v2)

Source: "Services page · copy v2" (20 Nov 2026). Build this as a NEW page at `/xservicesx`. The current `/services` page stays as it is.

Text in [square brackets] is a fact not yet confirmed. Never show bracketed text on the page. Put each one in a config value that is `null` by default; when it is `null`, hide that element (see "Facts to confirm" at the end).

---

## Page copy

Eight sections. Every button on the page does one of two things: **Get my free plan** (opens the form) or **Ask on WhatsApp**.

### 1 · First screen

- **Small line above the headline:** Private business advisors in Business Bay, Dubai
- **Headline (H1):** Make the right call on your UAE company, before you spend a dirham.
- **Line under it:** Free zone or mainland? Which costs come after year one? Tell us your plan, and an advisor gives you a clear answer, in writing. Your first consultation is free.
- **Buttons:** Get my free plan · Ask on WhatsApp
- **Three short facts under the buttons:** Free, no obligation · In person or by video · Reply [within 1 working hour]
- **Proof line:** ★★★★★ "[Short quote from Michael's Google review, 15 words or fewer]" Michael, CEO, Doherty Capital
- **Quick form** (beside the headline on desktop; on phones the button opens it as a bottom sheet): see "Form".
- **Small print:** Best Solution is a private business consultancy, not a government office or a free zone authority.

### 2 · Sound familiar?

- **Heading (H2):** Sound familiar?
- Three consultants gave you three different prices, and you can't tell which is right.
- You've read ten articles and you're still not sure: free zone or mainland?
- You don't know if a free zone allows your activity.
- You're worried about costs that only show up in year two.
- **Closing line:** That's exactly what we sort out with you, in one conversation, before you commit to anything.

### 3 · Pick your situation

- **Heading (H2):** Where are you right now?
- **Line under it:** Pick the one closest to you. We'll take it from there.

Six cards. Each card's button opens the form with the matching "Need" answer already chosen.

| Card title | Who it's for | What you'll get | Button | Need value | More details link |
| --- | --- | --- | --- | --- | --- |
| I'm starting a new company | Founders in the UAE or abroad with a business idea and a budget | Where to base it, what year one and renewal will cost, and what to prepare | Get my free plan | Starting a new company | /cost-calculator |
| Free zone or mainland? | Anyone comparing where to base their company | What each one allows, what each costs, and which fits your activity and customers | Get my free plan | Free zone or mainland | /freezone · /mainland |
| I want to hold assets or own several companies | Owners of property, shares or more than one business | Whether a holding or offshore structure fits, and how it would work for you | Get my free plan | Holding or several companies | /spv · /offshore |
| I need my books done every month | Running companies behind on bookkeeping, or tired of chasing it | Clean monthly books, matched bank statements and reports you can actually read | Get my free quote | Bookkeeping | /accounting |
| I have Corporate Tax questions | Companies unsure what applies to them or when their return is due | Whether it applies, your deadlines, and help preparing your return | Get my free plan | Corporate Tax | /corporate-tax |
| I'm not sure yet | Anyone with a plan but no clear next step | An advisor reads your plan and tells you where to start | Get my free plan | Not sure yet | (none) |

### 4 · In one free consultation, you'll know

- **Heading (H2):** In one free consultation, you'll know
1. **Which structure fits**, and why the others don't
2. **What it costs**: year one and every year after
3. **What to prepare**, as a simple checklist
4. **How long it takes**, realistically
5. **What our help costs**, confirmed in writing before any work starts
- **Line under it:** No pressure to buy anything. If we're not the right fit, we'll tell you.
- **Button:** Get my free plan

### 5 · How it works

- **Heading (H2):** Three steps. No surprises.
1. **Tell us your plan.** Use the form or WhatsApp. It takes 2 minutes.
2. **Talk it through.** A [30-minute] call by video, or a coffee at our Business Bay office.
3. **Get it in writing.** Your plan, costs and timeline, written down. Decide in your own time.

### 6 · Meet your advisor

- **Heading (H2):** Meet the people you'll talk to
- **Advisor card:** [Photo] · [Name], [role] · Speaks [languages] · "[One sentence in their own words]" · link "Message [name] on WhatsApp"
- **Why people trust us:**
  - **An office you can visit** in Business Bay, Dubai
  - **Fees in writing first.** You know what our help costs before we start
  - **Plain answers.** Your options explained simply, so you can compare them yourself
  - **[Emirati-owned, advising since 2014]** (only if confirmed)

If the advisor card is not confirmed, hide the card and show only "Why people trust us".

### 7 · What clients say

- **Heading (H2):** What clients say
- **Line under it:** [Rated X out of 5 from Y Google reviews] (hidden until confirmed)
- The two existing Google reviews (Michael, Doherty Capital; Hadi, Soft Miller), each shown ONCE. Use the existing review data; no hard-coded star text outside the claims switch.
- [One short client story: situation, what we advised, the result] (hidden until confirmed). Under it: "Want the same clarity? Get my free plan"
- Link: Read all Google reviews

### 8 · Questions, then the last step

- **Heading (H2):** Questions people ask before they call
- **Is the first consultation really free?** Yes. No fee, no obligation, and no pressure to buy anything afterwards.
- **Will you push me into a package?** No. We recommend what fits your plan and confirm any fee in writing first. You decide, in your own time.
- **Are you a government office or a free zone authority?** No. We're a private business consultancy. Final decisions on any application are made by the relevant UAE authorities.
- **I'm not in the UAE yet. Can you still help?** Yes. Many clients plan their company from abroad. We meet by video and send everything in writing.
- **How much will my company cost?** It depends on your activity, where you base it and your team. After the first conversation you get a written breakdown for year one and the years after.
- **How fast will you reply?** [Within 1 working hour], Monday to Friday, 9am to 6pm. After hours, we reply the next working morning. (If the reply time isn't confirmed: "Monday to Friday, 9am to 6pm. After hours, we reply the next working morning.")
- **Final heading (H2):** Leave your first call knowing exactly what to do, and what it will cost.
- **Line under it:** Free. No obligation. Fees in writing before any work starts.
- The form again, then: **Ask on WhatsApp** · Call [+971 52 233 0011] · Monday to Friday, 9am to 6pm · Business Bay, Dubai (map link)
- **Footer small print:** Best Solution is a private business consultancy and is not affiliated with any government entity or free zone authority. Free zone names identify the zones we advise on and do not imply any partnership. Final decisions are made only by the relevant UAE authorities.

---

## Page flow and layout

Nothing is cut. The page feels short because details sit folded until tapped, and every section ends one tap from the form. Target: about 7 to 8 phone screens (390 px wide) with details folded.

| Section | Desktop | Phone | Folded until tapped | Leads to the form by |
| --- | --- | --- | --- | --- |
| 1 · First screen | Copy left, form card right | Headline, 2 lines, 2 buttons, review quote; form opens as a bottom sheet | Nothing | "Get my free plan" button and the form card |
| 2 · Sound familiar? | 4 worries in a 2 × 2 grid with a small cross icon; promise line below in bold | 4 short lines stacked | Nothing | Promise line ends with an arrow down to the cards |
| 3 · Where are you right now? | 3 × 2 cards: icon, title, who it's for, what you'll get | 2-column tiles, icon and title only | On phone, "who it's for" and "what you'll get" open on tap | Each card's button opens the form with Need pre-filled |
| 4 · You'll know | 5 outcomes in one icon row, one line each | Icons in a 2-column grid | Nothing | Button under the row, plus the reassurance line |
| 5 · Three steps | 3 steps across, joined by a line | 3 steps stacked, numbered | Nothing | The sticky bar carries it |
| 6 · Meet the people | Advisor card left, 3 trust facts right | Card, then facts | Nothing | "Message [name] on WhatsApp" on the advisor card |
| 7 · What clients say | Rating badge, 2 reviews side by side, client story below | Rating, then reviews to swipe | Full review text ("Read more") and the story's detail | "Want the same clarity? Get my free plan" |
| 8 · Questions, then the last step | Accordion beside the final headline and form | Questions folded, then headline and form | Every answer until its question is tapped | Final form, WhatsApp and call |

**Click and trust devices**

- Every button says "Get my free plan" (the bookkeeping card: "Get my free quote").
- A safety line under every button: "Free · 2 minutes · no obligation".
- Sticky bar on phones from section 2 down: "Get my free plan" + WhatsApp icon. It must sit above the cookie banner area, never under it.
- A review quote beside the first button; rating and client story just before the last form.

---

## Form

One short form, used in the first screen, by every card and at the end. Three required fields; email optional.

- **Form title:** Get your free plan
- **Line under it:** Takes 2 minutes. We reply on WhatsApp [within 1 working hour]. (If not confirmed: "Takes 2 minutes. We reply on WhatsApp.")

| Field | Label | Placeholder or options | Required |
| --- | --- | --- | --- |
| Name | Your name | e.g. Sara Ahmed | Yes |
| WhatsApp | WhatsApp number | Country picker (UAE first), then e.g. 50 123 4567 | Yes |
| Need | Where are you right now? | Starting a new company · Free zone or mainland · Holding or several companies · Bookkeeping · Corporate Tax · Not sure yet | Yes (pre-filled when opened from a card) |
| Email | Email (optional) | name@company.com | No |

- **Button:** Get my free plan
- **Under the button:** Free and no obligation. By sending this, you agree we can contact you about your request by WhatsApp, phone or email. Privacy policy.

**Error messages**

- Name missing: Please add your name.
- Number not valid: This doesn't look like a [country] mobile number. Check it, or change the country.
- Need not chosen: Please pick where you are right now.
- Email not valid: Please check your email, or leave it empty.
- Sending failed: Sorry, that didn't go through. Message us on WhatsApp or call +971 52 233 0011 and we'll help straight away.

**Success message:** Thanks, [first name]. Your request is in. An advisor will message you on WhatsApp [within 1 working hour] (Monday to Friday, 9am to 6pm) to agree a time. Want to start now? **Open WhatsApp**

---

## Meta

- **Page title:** Make the Right Call on Your UAE Company | Best Solution
- **Meta description:** Free zone or mainland? What will it cost after year one? Tell us your plan and get a clear, written answer from a Dubai advisor. First consultation free.
- noindex, like the rest of the subdomain.

## Facts to confirm (hidden until filled)

| Config key (suggested) | Fact | Shown where |
| --- | --- | --- |
| replyTime | "within 1 working hour" | Section 1 facts, FAQ, form line, success message |
| consultLength | "30-minute" | Section 5 step 2 |
| advisor | photo, name, role, languages, one sentence | Section 6 card and WhatsApp link |
| heroQuote | quote from Michael's review, 15 words or fewer | Section 1 proof line |
| rating | Google rating and review count | Section 7 line |
| clientStory | situation, advice, result | Section 7 |
| emiratiOwnedSince | "Emirati-owned, advising since 2014" | Section 6 trust list |
| callNumber | +971 52 233 0011 (use SITE) | Section 8 |
