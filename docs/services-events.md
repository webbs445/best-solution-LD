# /services: dataLayer events

For setting up GTM (container GTM-MLFW9XR, shared with best-solution.ae). The Services page now lives at `/services`. It was built at `/xservicesx`, which now returns a 301 to `/services`.

- **Shared names.** The page uses the same event names as the other landing pages for the same actions. No event name starts with `xs_`; a test fails if one does.
- **Two fields on every event.** Every event the page sends carries `page_path` (for example `"/services"`) and `page_type: "landing"`, on top of the parameters below. That includes the shared events and the conversions.
- **Shared tracking adds `page_data`.** Events from the site-wide tracking (`components/analytics/AnalyticsInit`), and the page's own events, also carry `page_data`: page_location, canonical_path, content_group, language, and approximate country and city.
- **No personal data in any event.** No name, phone number, email, click ID (gclid, gbraid, wbraid) or typed text is ever sent:
  - `form_submit` and `generate_lead` go out with an empty `user_data`.
  - The S8 question box reports only `has_text`, never the text.
  - `phone_click` carries the business number, not the visitor's.
- **Consent unchanged.** Tags fire under the site's Consent Mode v2 setup:
  - GTM loads with every signal denied until the visitor chooses, and Google tags may send cookieless pings.
  - Clarity waits for analytics consent.

| New name | Old name | When it fires | Parameters (plus page_path, page_type) | Example |
|---|---|---|---|---|
| `content_view` | (unchanged) | Page load | page_data | `{event:"content_view", page_path:"/services", page_type:"landing"}` |
| `scroll_depth` | (unchanged) | First time the visitor passes 25, 50, 75 and 90% of the page | percent, page_data | `{event:"scroll_depth", percent:50, page_path:"/services"}` |
| `engaged_time_on_topic` | (unchanged) | After 30, 45, 60 and 120 s of active time | seconds, threshold, page_data | `{event:"engaged_time_on_topic", seconds:60}` |
| `consultation_cta_click` | `xs_cta_click` | Any plan button (opens the plan pop-up), and the four S3 small-card buttons (`s3_fz_or_mainland`, `s3_plan_structure`, `s3_bookkeeping`, `s3_corporate_tax`), which link to their service page instead | cta_location: the button id (`header_plan`, `hero_primary`, `hero_card`, `s2_get_answers`, `s3_plan_new_company`, `s3_fz_or_mainland`, `s3_plan_structure`, `s3_bookkeeping`, `s3_corporate_tax`, `s3_not_sure`, `s4_want_plan`, `s5_continue`, `trust_plan`, `callback`, `sticky_plan`), page_data | `{event:"consultation_cta_click", cta_location:"hero_primary", page_path:"/services", page_type:"landing"}` |
| `whatsapp_click` | `xs_whatsapp_click` | Any WhatsApp link or button. Also the S8 question box send button, which opens WhatsApp | cta_location (`hero`, `header`, `sticky`, `s9`, `popup`, `s9_thanks`, `popup_thanks`, `footer`, `s8_ask`, …), value 70, currency AED, page_data. S8 send only: `has_text` true/false | `{event:"whatsapp_click", cta_location:"s8_ask", has_text:true, value:70, currency:"AED"}` |
| `phone_click` | `xs_phone_click` | Any call link (header, chat header, footer) | phone_number (the business number), cta_location, value 70, currency AED, page_data | `{event:"phone_click", phone_number:"+971522330011", cta_location:"header"}` |
| `email_click` | (unchanged) | The footer email link | email_address (the business address), cta_location, value 40, currency AED | `{event:"email_click", cta_location:"Footer"}` |
| `form_start` | `xs_form_start` | First focus in the plan form (S9 or pop-up) | form_data.form_id `"LP Services Plan"`, page_data | `{event:"form_start", form_data:{form_id:"LP Services Plan"}, page_path:"/services"}` |
| `form_error` | `xs_form_error` | A send is blocked by wrong or missing fields (after the form was started) | form_data {form_id, error_fields (field names only: `lead_name`, `email_id`, `mobile_no`), attempt} | `{event:"form_error", form_data:{form_id:"LP Services Plan", error_fields:"email_id", attempt:1}}` |
| `form_abandon` | (unchanged) | Visitor leaves after starting the form without a confirmed send | form_data {form_id, last_field, fields_filled, error_fields, submit_attempts, seconds_in_form, exit} | `{event:"form_abandon", form_data:{form_id:"LP Services Plan", exit:"page_leave"}}` |
| `form_submit` | (unchanged) | **The conversion.** Once per lead the server confirms (never on an error) | event_id (`evt_…`, the same id stored on the ERP lead), form_data {form_id `"LP Services Plan"`, form_name, form_type, service_interest (topic), lead_conversion_eligible: true, lead_type, value, currency}, user_data: empty | `{event:"form_submit", event_id:"evt_…", form_data:{lead_conversion_eligible:true, service_interest:"holding"}, page_path:"/services"}` |
| `generate_lead` | (unchanged) | Straight after `form_submit` | form_id, lead_type "form", page `"/services"`, service, topic, contact_pref (`whatsapp` / `call`), form_location (`s9` / `popup`), value 100, currency AED. Every parameter it had before is kept, so the Google Ads conversion is unaffected | `{event:"generate_lead", topic:"holding", contact_pref:"call", form_location:"popup", page:"/services", value:100, page_path:"/services", page_type:"landing"}` |
| `faq_expand` | `xs_faq_open` | A question in S8 is tapped | faq_question (the question, up to 80 characters), page_data | `{event:"faq_expand", faq_question:"What decides my cost?"}` |
| `consent_update` | (unchanged) | The visitor saves a cookie choice | consent {analytics, marketing} | `{event:"consent_update", consent:{analytics:true, marketing:false}}` |
| `topic_select` | `xs_topic_select` | A topic is picked (hero card, S3 card, S5 chips, S9 plan, pop-up dropdown) | topic (`new_company`, `fz_or_mainland`, `holding`, `bookkeeping`, `corporate_tax`, `not_sure`), source (`hero`, `s3`, `s5`, `s9`, `popup`), page `"/services"` | `{event:"topic_select", topic:"bookkeeping", source:"s3", page_path:"/services"}` |
| `worry_toggle` | `xs_worry_toggle` | A worry in S2 is ticked or unticked | worry_id (0 to 5), on, count, page | `{event:"worry_toggle", worry_id:1, on:true, count:2}` |
| `explainer_open` | `xs_explainer_open` (earlier `xs_cta_click` fz_explainer) | S3 "What's the difference?" is opened | location `"s3"`, page | `{event:"explainer_open", location:"s3"}` |
| `advisor_view` | `xs_advisor_view` | An advisor panel is opened (only once advisors are switched on; none today) | advisor (id), page | `{event:"advisor_view", advisor:"essa"}` |
| `advisor_select` | `xs_advisor_select` | A plan button for one advisor is pressed (only once advisors are on) | advisor (id), page | `{event:"advisor_select", advisor:"essa"}` |

## GTM triggers

- **Google Ads lead conversion:** Custom Event `form_submit` where `form_data.lead_conversion_eligible` equals true and `event_id` starts with `evt_`. This is the same trigger as the other landing pages. Use `event_id` as the order or transaction ID so the conversion matches the ERP lead.
- **GA4 lead:** Custom Event `generate_lead`. Use `topic`, `contact_pref` and `form_location` as event parameters.
- **Contact clicks:** `whatsapp_click` and `phone_click`, which the other pages already use. Read `cta_location` for where the click happened.
- **This page only:** filter on `page_path` equals `/services` or `page_type` equals `landing`.
- **Old trigger names:** any trigger built on an `xs_` name, or on `page_path` / `page` equal to `/xservicesx`, needs the new name and path.
