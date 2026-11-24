import { describe, expect, it } from "vitest";
import { choiceRows, maskPhone, nameOk, planPhoneError } from "./servicesPlan";
import { checkPlan } from "./servicesPlanCheck";
import { HERO_PLANS, TOPICS, TOPIC_IDS, TOPIC_SERVICE, isTopic, waLink } from "@/content/xservicesx";
import { XS_CONFIG } from "@/content/xservicesx.config";
import { cleanState } from "@/components/xservicesx/store";

const ok = { name: "Test", phone: "50 000 0000", email: "test.lead@example.com" };

describe("/xservicesx form rules", () => {
  it("accepts name, a UAE number typed the local way and an email", () => {
    expect(checkPlan(ok, "AE")).toEqual({ errors: {}, e164: "+971500000000" });
  });

  it("asks for every empty field in plain words", () => {
    expect(checkPlan({ name: "", phone: "", email: "" }, "AE").errors).toEqual({
      name: "Please add your name.",
      phone: "Please add your WhatsApp number.",
      email: "Please add your email.",
    });
  });

  it("refuses a bad name, number and email", () => {
    const { errors } = checkPlan({ name: "T", phone: "12", email: "nope" }, "AE");
    expect(Object.keys(errors)).toEqual(["name", "phone", "email"]);
    expect(errors.phone).toBe(planPhoneError("AE"));
  });

  it("allows letters in any alphabet, spaces, apostrophes, hyphens and dots, 2 to 60 long", () => {
    for (const n of ["Sara Ahmed", "O'Neil", "Jean-Luc", "Dr. Ali", "محمد علي", "Zoë"]) expect(nameOk(n), n).toBe(true);
    for (const n of ["A", "1234", "Sara <b>", "x".repeat(61), " -Sara"]) expect(nameOk(n), n).toBe(false);
  });

  it("reads the number for the chosen country, and accepts another country's number typed with +", () => {
    expect(checkPlan({ ...ok, phone: "50 000 0000" }, "GB").errors.phone).toBeTruthy();
    expect(checkPlan({ ...ok, phone: "+44 7911 123456" }, "AE").e164).toBe("+447911123456");
  });

  it("masks the number for the plan preview", () => {
    expect(maskPhone("050 123 4567", "+971")).toBe("+971 50 ••• 67");
    expect(maskPhone("+44 7700 900123", "+971")).toBe("+44 ••• 23");
    expect(maskPhone("05", "+971")).toBeNull();
  });
});

describe("topics and the lead notes", () => {
  it("maps every topic to a label, a hero plan and an exact ERP Service Enquired option", () => {
    expect(TOPIC_IDS).toEqual(["new_company", "fz_or_mainland", "holding", "bookkeeping", "corporate_tax", "not_sure"]);
    for (const t of TOPIC_IDS) expect(HERO_PLANS[t].rows.length).toBe(4);
    expect(TOPIC_SERVICE).toEqual({
      new_company: undefined,
      fz_or_mainland: undefined,
      holding: "Other Services",
      bookkeeping: "Accounting & Bookkeeping Services",
      corporate_tax: "VAT & Tax Services",
      not_sure: undefined,
    });
    expect(isTopic("holding")).toBe(true);
    expect(isTopic("visa")).toBe(false);
  });

  it("writes the page choices as labelled lines, using only the page's own values", () => {
    expect(choiceRows({ topic: "fz_or_mainland", worries: [4, 2, 99, "x", 2], advisor_pref: "any", contact_pref: "call", consult_mode: "office" })).toEqual([
      ["Topic", "Free zone or mainland"],
      ["Questions", "What will year two cost?; Free zone or mainland?"],
      ["Advisor", "Any"],
      ["Reply by", "Phone call"],
      ["Meeting", "Business Bay office"],
      ["Form location", "s9"],
    ]);
    expect(choiceRows({ topic: "<script>" })[0]).toEqual(["Topic", TOPICS.not_sure.label]);
    expect(choiceRows({ worries: [0] })[1]).toEqual(["Questions", "Where do I begin?"]);
    expect(choiceRows({ form_location: "popup" }).at(-1)).toEqual(["Form location", "popup"]);
    expect(choiceRows({ form_location: "elsewhere" }).at(-1)).toEqual(["Form location", "s9"]);
  });

  it("puts the topic, never contact details, in the WhatsApp link", () => {
    expect(waLink("holding")).toBe(`https://wa.me/${XS_CONFIG.whatsappNumber}?text=Hi%2C%20I'd%20like%20advice%20on%3A%20Holding%20assets`);
    expect(waLink(null)).toBe(`https://wa.me/${XS_CONFIG.whatsappNumber}`);
  });
});

describe("page state", () => {
  it("keeps only values the page offers when read back from sessionStorage", () => {
    expect(cleanState({ topic: "bookkeeping", worries: [0, 0, 2, 9, "1"], advisor: "nobody", contactPref: "call", consultMode: "office" })).toEqual({
      topic: "bookkeeping",
      worries: [0, 2],
      advisor: null,
      contactPref: "call",
      consultMode: "office",
    });
    expect(cleanState("junk")).toMatchObject({ topic: null, worries: [], contactPref: "whatsapp" });
    expect(cleanState({ advisor: "any" }).advisor).toBe("any");
  });
});

describe("XS_CONFIG facts still to confirm", () => {
  it("leaves unconfirmed facts null or empty (the elements that need them are hidden)", () => {
    expect(XS_CONFIG).toMatchObject({
      consultLength: null,
      planDelivery: null,
      teamLanguages: null,
      advisors: [],
      clientStory: null,
      aboutUrl: null,
      feesInWritingConfirmed: false,
    });
  });

  it("holds the facts confirmed for this page", () => {
    expect(XS_CONFIG).toMatchObject({
      replyTime: "the same day",
      officeAddress: "Office 906, Capital Golden Tower, Business Bay, Dubai",
      officeHours: "Monday to Friday, 9am to 6pm",
      googleRating: 4.8,
      googleReviewCount: 225,
      whatsappNumber: "97145531546",
      phoneNumber: { display: "+971 52 233 0011", href: "tel:+971522330011" },
    });
  });
});

describe("/xservicesx reviews", () => {
  it("has the 13 approved reviews, Michael first, and none names Yasmin, Yasmine or Jasmine", () => {
    expect(XS_CONFIG.reviews).toHaveLength(13);
    expect(XS_CONFIG.reviews[0].firstNameInitial).toBe("Michael D.");
    expect(XS_CONFIG.reviews.filter((r) => /\b(yasmine?|jasmine)\b/i.test(r.text)).map((r) => r.firstNameInitial)).toEqual([]);
  });
});
