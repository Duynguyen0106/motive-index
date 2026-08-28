#!/usr/bin/env node
/**
 * Reference accuracy validation — citations, URLs, provenance tiers, and
 * multilingual original-language requirements for verified dossiers.
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const { CASE_REFERENCE_OVERRIDES } = await import(
    join(root, "src/data/caseReferenceCatalog.ts")
  );
  const { MULTILINGUAL_CASE_DEFS } = await import(
    join(root, "src/data/multilingualCases.ts")
  );
  const { resetStore, getAllCases } = await import(join(root, "src/lib/data.ts"));
  const { isCompositeCase } = await import(join(root, "src/lib/caseSummaries.ts"));
  const {
    resolveProvenanceTier,
    PROVENANCE_TAG,
  } = await import(join(root, "src/lib/validation/caseProvenance.ts"));
  const {
    validateCaseReferenceSet,
    getPrimaryDirectReferences,
    classifyReferenceQuality,
  } = await import(join(root, "src/lib/validation/referenceAccuracy.ts"));

  const errors = [];
  const warnings = [];

  console.log("=== Motive Index Reference Accuracy Validation ===\n");

  // 1. Catalog overrides (verified by definition)
  for (const [slug, refs] of Object.entries(CASE_REFERENCE_OVERRIDES)) {
    const violations = validateCaseReferenceSet({
      slug,
      references: refs,
      provenanceTier: "verified",
    });
    for (const v of violations) {
      (v.level === "error" ? errors : warnings).push(v.message);
    }
  }

  // 2. Multilingual defs
  for (const def of MULTILINGUAL_CASE_DEFS) {
    const violations = validateCaseReferenceSet({
      slug: def.slug,
      references: def.references ?? [],
      provenanceTier: "verified",
      multilingual: true,
    });
    for (const v of violations) {
      (v.level === "error" ? errors : warnings).push(v.message);
    }
  }

  // 3. Assembled runtime cases
  resetStore();
  const cases = getAllCases();
  let verifiedWithPrimary = 0;
  let curatedTemplateOnly = 0;

  for (const c of cases) {
    if (isCompositeCase(c)) continue;

    const tier = resolveProvenanceTier({
      slug: c.slug,
      tags: c.tags,
      references: c.references,
      offenderName: c.offenders?.[0]?.name,
      name: c.name,
      analysisStatus: c.analysis?.status,
    });

    const violations = validateCaseReferenceSet({
      slug: c.slug,
      references: c.references ?? [],
      provenanceTier: tier,
      multilingual: c.tags?.includes("multilingual-source"),
    });

    for (const v of violations) {
      (v.level === "error" ? errors : warnings).push(v.message);
    }

    if (tier === "verified" && getPrimaryDirectReferences(c.references ?? []).length > 0) {
      verifiedWithPrimary += 1;
    }
    if (
      c.tags?.includes(PROVENANCE_TAG.curated) &&
      (c.references ?? []).every((r) => classifyReferenceQuality(r) === "synthetic-template")
    ) {
      curatedTemplateOnly += 1;
    }
  }

  console.log(`Reference overrides: ${Object.keys(CASE_REFERENCE_OVERRIDES).length}`);
  console.log(`Multilingual defs: ${MULTILINGUAL_CASE_DEFS.length}`);
  console.log(`Runtime cases scanned: ${cases.length}`);
  console.log(`Verified with direct primary URL: ${verifiedWithPrimary}`);
  console.log(`Curated template-only (expected until overrides added): ${curatedTemplateOnly}`);
  console.log();
  console.log(`ERRORS: ${errors.length}`);
  errors.slice(0, 40).forEach((e) => console.log("  ✗", e));
  if (errors.length > 40) console.log(`  ... and ${errors.length - 40} more`);
  console.log(`\nWARNINGS: ${warnings.length}`);
  warnings.slice(0, 25).forEach((w) => console.log("  ⚠", w));
  if (warnings.length > 25) console.log(`  ... and ${warnings.length - 25} more`);

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
