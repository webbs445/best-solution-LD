import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // fetch to tag hosts, Google and the Apps Script bridge throws in every test.
    setupFiles: ["./vitest.setup.mjs"],
  },
});
