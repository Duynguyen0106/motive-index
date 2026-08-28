/**
 * Store validation runner — invoked via tsx from validate-store.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isModerationDraftCase,
  shouldIndexCase,
} from "../src/lib/casePublishState.ts";
import { validateProvenance } from "../src/lib/validation/caseProvenance.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const storePath = path.join(root, ".data", "store.json");

const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
const cases = store.cases ?? [];

if (!cases.length) {
  console.log("Store has no cases — nothing to validate.");
  process.exit(0);
}

let errors = 0;
let warnings = 0;
let draftCount = 0;
let indexableCount = 0;

console.log(`=== Store validation (${cases.length} cases) ===\n`);

for (const c of cases) {
  if (isModerationDraftCase(c)) draftCount += 1;
  if (shouldIndexCase(c)) indexableCount += 1;

  const violations = validateProvenance({
    slug: c.slug,
    tags: c.tags,
    references: c.references,
    offenderName: c.offenders?.[0]?.name,
    name: c.name,
    analysisStatus: c.analysis?.status,
  });

  for (const v of violations) {
    const line = `[${v.level}] ${c.slug}: ${v.message}`;
    if (v.level === "error") {
      console.error(line);
      errors += 1;
    } else {
      console.warn(line);
      warnings += 1;
    }
  }

  if (
    c.analysis?.status === "published" &&
    c.analysis?.reviewedByHuman &&
    isModerationDraftCase(c)
  ) {
    console.error(
      `[error] ${c.slug}: published + human-reviewed but still tagged as moderation draft`,
    );
    errors += 1;
  }
}

console.log(`\nModeration drafts: ${draftCount}`);
console.log(`Sitemap-indexable: ${indexableCount}`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors > 0) {
  console.log("\n✗ Store validation failed");
  process.exit(1);
}
console.log("\n✓ Store validation passed");
