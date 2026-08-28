#!/usr/bin/env node
/**
 * Source-accuracy validation for curated catalog entries.
 * Uses shared provenance framework — flags fabricated or unverified cases.
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function useFreshSeed() {
  const { resetStore } = await import(join(root, "src/lib/data.ts"));
  resetStore();
}

async function main() {
  await useFreshSeed();
  const { getAllCases } = await import(join(root, "src/lib/data.ts"));
  const { isCompositeCase } = await import(join(root, "src/lib/caseSummaries.ts"));
  const { CASE_REFERENCE_OVERRIDES } = await import(join(root, "src/data/caseReferenceCatalog.ts"));
  const {
    validateProvenance,
    isSyntheticReference,
    PROVENANCE_TAG,
  } = await import(join(root, "src/lib/validation/caseProvenance.ts"));

  const cases = getAllCases();
  const errors = [];
  const warnings = [];

  for (const c of cases) {
    if (isCompositeCase(c)) continue;

    const violations = validateProvenance({
      slug: c.slug,
      tags: c.tags,
      references: c.references,
      offenderName: c.offenders?.[0]?.name,
      name: c.name,
      analysisStatus: c.analysis?.status,
    });

    for (const v of violations) {
      if (v.level === "error") errors.push(v.message);
      else warnings.push(v.message);
    }

    if (c.tags.includes("draft")) continue;

    const refs = c.references ?? [];
    const hasOverride = Boolean(CASE_REFERENCE_OVERRIDES[c.slug]?.length);
    const onlySynthetic =
      refs.length > 0 && refs.every(isSyntheticReference);

    if (
      c.tags.includes(PROVENANCE_TAG.curated) &&
      !hasOverride &&
      onlySynthetic
    ) {
      warnings.push(`Curated tier with only template references: ${c.slug}`);
    }

    if (c.slug === "louay-al-taei") {
      const text = `${c.name} ${c.overview}`.toLowerCase();
      if (text.includes("abdul latif rashid") && !text.includes("do not confuse")) {
        errors.push("louay-al-taei still conflates with Abdul Latif Rashid");
      }
    }

    if (c.tags.includes("false-confession")) {
      const fakeCourt = refs.some(
        (r) =>
          r.kind === "court" &&
          !r.synthetic &&
          r.citation.toLowerCase().includes("proceedings"),
      );
      if (fakeCourt) {
        warnings.push(`False-confession case has unmarked court conviction ref: ${c.slug}`);
      }
    }
  }

  console.log("=== Motive Index Source Validation ===\n");
  console.log(`Cases scanned: ${cases.length}`);
  console.log(`Reference overrides: ${Object.keys(CASE_REFERENCE_OVERRIDES).length}`);
  console.log();
  console.log(`ERRORS: ${errors.length}`);
  errors.forEach((e) => console.log("  ✗", e));
  console.log(`\nWARNINGS: ${warnings.length}`);
  warnings.slice(0, 25).forEach((w) => console.log("  ⚠", w));
  if (warnings.length > 25) console.log(`  ... and ${warnings.length - 25} more`);

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
