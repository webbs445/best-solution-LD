# /xservicesx: dataLayer events

For setting up GTM (container GTM-MLFW9XR, shared with best-solution.ae). The page uses the **same event names as the other landing pages** for the same actions. Its own `xs_` events are kept only for actions that exist on this page alone.

**No event carries personal data.** No name, phone number, email, click ID (gclid, gbraid, wbraid) or typed text is ever sent. Here is what that means in practice:

- `form_submit` and `generate_lead` are sent with an empty `user_data` on this page.
- The S8 question box reports only whether text was typed (`has_text`), never the text itself.
- `phone_click` carries the business number, not the visitor's.

Events that come from the site-wide tracking (`components/analytics/AnalyticsInit`) also carry `page_data` (page_location, canonical_path, content_group, language, approximate country and city). The page's own `xs_` events carry it too, plus `page: "/xservicesx"`.

Tags fire under the site's Consent Mode v2 setup. GTM loads with every signal denied until the visitor chooses (Google tags may send cookieless pings), and Clarity waits for analytics consent. This page changes nothing about that.

## Events

| Event | When it fires | Parameters | Example |
|---|---|---|---|
| `content_view` | Page load | page_data | `{event:"content_view", page_data:{canonical_path:"/xservicesx", …}}` |
| `scroll_depth` | First time the visitor passes 25, 50, 75 and 90% of the page | percent, page_data | `{event:"scroll_depth", percent:50}` |
| `engaged_time_on_topic` | After 30, 45, 60 and 120 s of active time | seconds, threshold, page_data | `{event:"engaged_time_on_topic", seconds:60}` |
| `consultation_cta_click` | Any plan button (they all open the plan pop-up) | cta_location: the button id (below), page_data | `{event:"consultation_cta_click", cta_location:"hero_primary"}` |
| `whatsapp_click` | Any WhatsApp link or button. Also the S8 question box send button, which opens WhatsApp | cta_location (where: `hero`, `header`, `sticky`, `s9`, `popup`, `s9_thanks`, `popup_thanks`, `footer`, `s8_ask`, …), value 70, currency AED, page_data. S8 send only: `has_text` true/false | `{event:"whatsapp_click", cta_location:"s8_ask", has_text:true, value:70, currency:"AED"}` |
| `phone_click` | Any call link (header, chat header, footer) | phone_number (the business number), cta_location, value 70, currency AED, page_data | `{event:"phone_click", phone_number:"+971522330011", cta_location:"header"}` |
| `email_click` | The footer email link | email_address (the business address), cta_location, value 40, currency AED | `{event:"email_click", cta_location:"Footer"}` |
| `form_start` | First focus in the plan form (S9 or pop-up) | form_data.form_id `"LP Services Plan"`, page_data | `{event:"form_start", form_data:{form_id:"LP Services Plan"}}` |
| `form_error` | A send is blocked by wrong or missing fields (after the form was started) | form_data {form_id, error_fields (field names only: `lead_name`, `email_id`, `mobile_no`), attempt} | `{event:"form_error", form_data:{form_id:"LP Services Plan", error_fields:"email_id", attempt:1}}` |
| `form_abandon` | Visitor leaves after starting the form without a confirmed send | form_data {form_id, last_field, fields_filled, error_fields, submit_attempts, seconds_in_form, exit} | `{event:"form_abandon", form_data:{form_id:"LP Services Plan", exit:"page_leave"}}` |
| `form_submit` | **The conversion.** Once per lead the server confirms (never on an error) | event_id (`evt_…`, the same id stored on the ERP lead), form_data {form_id `"LP Services Plan"`, form_name, form_type, service_interest (topic), lead_conversion_eligible: true, lead_type, value, currency}, user_data: empty | `{event:"form_submit", event_id:"evt_…", form_data:{lead_conversion_eligible:true, service_interest:"holding"}}` |
| `generate_lead` | Straight after `form_submit` | form_id, lead_type "form", page, service, topic, contact_pref (`whatsapp` / `call`), form_location (`s9` / `popup`), value 100, currency AED | `{event:"generate_lead", topic:"holding", contact_pref:"call", form_location:"popup", value:100}` |
| `faq_expand` | A question in S8 is tapped | faq_question (the question, up to 80 characters), page_data | `{event:"faq_expand", faq_question:"What decides my cost?"}` |
| `consent_update` | The visitor saves a cookie choice | consent {analytics, marketing} | `{event:"consent_update", consent:{analytics:true, marketing:false}}` |
| `xs_topic_select` | A topic is picked (hero card, S3 card, S6 chips, S9 plan, pop-up dropdown) | topic (`new_company`, `fz_or_mainland`, `holding`, `bookkeeping`, `corporate_tax`, `not_sure`), source (`hero`, `s3`, `s5`, `s9`, `popup`) | `{event:"xs_topic_select", topic:"bookkeeping", source:"s3"}` |
| `xs_worry_toggle` | A worry in S2 is ticked or unticked | worry_id (0 to 5), on, count | `{event:"xs_worry_toggle", worry_id:1, on:true, count:2}` |
| `xs_explainer_open` | S3 "What's the difference?" is opened | location `"s3"` | `{event:"xs_explainer_open", location:"s3"}` |
| `xs_advisor_view` / `xs_advisor_select` | Only once advisors are switched on (none today) | advisor (id) | `{event:"xs_advisor_select", advisor:"essa"}` |

### Plan button ids (`consultation_cta_click` cta_location)

`header_plan`, `hero_primary`, `hero_card`, `s2_get_answers`, `s3_plan_new_company`, `s3_fz_or_mainland`, `s3_plan_structure`, `s3_bookkeeping`, `s3_corporate_tax`, `s3_not_sure`, `s4_want_plan`, `s5_continue`, `trust_plan`, `callback`, `sticky_plan` (and `s6_any` once advisors are on).

## Changes from the first version of this page

These events were renamed to the shared names. GTM triggers should use the new names.

| Old (no longer sent) | Now |
|---|---|
| `xs_cta_click` {cta_id, location} | `consultation_cta_click` {cta_location} |
| `xs_whatsapp_click` {location} | `whatsapp_click` {cta_location} |
| `xs_phone_click` {location} | `phone_click` {cta_location} |
| `xs_form_start` {location} | `form_start` {form_data.form_id} |
| `xs_form_error` {field, location} | `form_error` {form_data.error_fields} |
| `xs_faq_open` {question_id} | `faq_expand` {faq_question} |
| `xs_cta_click` {cta_id: "fz_explainer"} | `xs_explainer_open` |

## Suggested GTM triggers

- **Google Ads lead conversion:** Custom Event `form_submit` where `form_data.lead_conversion_eligible` equals true and `event_id` starts with `evt_`. This is the same trigger as the other landing pages. Use `event_id` as the order or transaction ID so the conversion matches the ERP lead.
- **GA4 lead:** Custom Event `generate_lead`. Use `topic`, `contact_pref` and `form_location` as event parameters.
- **Contact clicks:** Custom Events `whatsapp_click` and `phone_click`, which the other pages already use. Read `cta_location` for where the click happened.
- **Engagement:** `consultation_cta_click`, `faq_expand`, and the `xs_` events, as GA4 events if wanted. None is a conversion.
