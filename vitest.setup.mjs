// Unit tests never reach a tag host, Google or the Apps Script bridge: fetch to any of them throws (hosts in scripts/qa/hosts.mjs).
import { BLOCKED_HOSTS } from "./scripts/qa/hosts.mjs";

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (BLOCKED_HOSTS.test(url)) return Promise.reject(new Error(`Blocked in tests: ${new URL(url).hostname}`));
  return realFetch(input, init);
};
