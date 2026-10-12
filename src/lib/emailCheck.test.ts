import { beforeEach, describe, expect, it, vi } from "vitest";

const dns = vi.hoisted(() => ({ resolveMx: vi.fn(), resolve4: vi.fn() }));
vi.mock("node:dns/promises", () => dns);

import { emailLooksFake, LEAD_RULES } from "./lead";
import { emailDomainAcceptsMail } from "./emailCheck";

const err = (code: string) => Object.assign(new Error(code), { code });

describe("fake email check", () => {
  it("refuses throwaway services and made-up names, keeps real-looking ones", () => {
    expect(emailLooksFake("abc@mailinator.com")).toBe(true);
    expect(emailLooksFake("Test@gmail.com")).toBe(true);
    expect(emailLooksFake("asdf@company.ae")).toBe(true);
    expect(emailLooksFake("sara.k@company.ae")).toBe(false);
    expect(LEAD_RULES.email_id("someone@test.com")).toBe(false);
    expect(LEAD_RULES.email_id("someone@company.ae")).toBe(true);
  });
});

describe("mail server check", () => {
  beforeEach(() => {
    dns.resolveMx.mockReset();
    dns.resolve4.mockReset();
  });

  it("accepts a domain with a mail server", async () => {
    dns.resolveMx.mockResolvedValue([{ exchange: "mx.company.ae", priority: 10 }]);
    expect(await emailDomainAcceptsMail("a@company-one.ae")).toBe(true);
  });

  it("refuses a domain that does not exist, or says it takes no mail", async () => {
    dns.resolveMx.mockRejectedValue(err("ENOTFOUND"));
    expect(await emailDomainAcceptsMail("a@qwzxqwzx-none.com")).toBe(false);
    dns.resolveMx.mockResolvedValue([{ exchange: ".", priority: 0 }]);
    expect(await emailDomainAcceptsMail("a@nullmx.org")).toBe(false);
  });

  it("falls back to the domain's address, and lets DNS trouble through", async () => {
    dns.resolveMx.mockRejectedValue(err("ENODATA"));
    dns.resolve4.mockResolvedValue(["192.0.2.1"]);
    expect(await emailDomainAcceptsMail("a@a-record-only.com")).toBe(true);
    dns.resolveMx.mockRejectedValue(err("ESERVFAIL"));
    expect(await emailDomainAcceptsMail("a@dns-trouble.com")).toBe(true);
  });
});
