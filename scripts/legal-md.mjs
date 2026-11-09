// Writes docs/legal/privacy-v2-draft.md and terms-v2-draft.md from src/content/legalV2.ts (the single source).
// Usage: node scripts/legal-md.mjs   (Node 22.6+ strips the file's TypeScript types on import)
import fs from "node:fs";
import { LEGAL_V2_DRAFT } from "../src/content/legalV2.ts";
for (const [doc, { blocks, contactTitle, contactLine }] of Object.entries(LEGAL_V2_DRAFT)) {
  const md = blocks.map(([tag, text]) => (tag === "h1" ? `# ${text}` : tag === "h2" ? `## ${text}` : tag === "li" ? `- ${text}` : text));
  // Lists stay tight; every other block gets a blank line.
  const out = md.reduce((acc, line, i) => acc + (i && !(line.startsWith("- ") && md[i - 1].startsWith("- ")) ? "\n\n" : i ? "\n" : "") + line, "");
  const contact = `## ${contactTitle}\n\n${contactLine}\n\nEmail connect@best-solution.ae\nPhone +971 52 233 0011\nOffice: Business Bay, Dubai, UAE\n`;
  fs.writeFileSync(`docs/legal/${doc}-v2-draft.md`, `<!-- DRAFT for Best Solution legal approval. Generated from src/content/legalV2.ts: edit there, then run node scripts/legal-md.mjs -->\n\n${out}\n\n${contact}`);
}
console.log("ok");
