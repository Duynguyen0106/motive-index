#!/usr/bin/env node
/**
 * Ensures verified cases link to direct primary sources — not publisher homepages.
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
  const {
    isPrimarySourceReference,
    hasReferenceOverride,
    isMultilingualVerified,
  } = await import(join(root, "src/lib/validation/caseProvenance.ts"));
  const { isHomepageOnlyUrl, isDirectSourceUrl } = await import(
    join(root, "src/lib/validation/referenceUrls.ts")
  );

  const errors = [];
  const warnings = [];

  for (const [slug, refs] of Object.entries(CASE_REFERENCE_OVERRIDES)) {
    const primary = refs.filter(isPrimarySourceReference);
    const withUrl = primary.filter((r) => r.url?.trim());
    const direct = withUrl.filter((r) => isDirectSourceUrl(r.url));

    if (primary.length > 0 && direct.length === 0) {
      errors.push(
        `Override ${slug}: no direct primary-source URL (add article/report/court link)`,
      );
    }

    for (const r of refs) {
      if (r.url && isHomepageOnlyUrl(r.url)) {
        errors.push(`Override ${slug} -> ${r.id}: homepage-only URL (${r.url})`);
      }
    }
  }

  for (const def of MULTILINGUAL_CASE_DEFS) {
    const refs = def.references ?? [];
    const primary = refs.filter(isPrimarySourceReference);
    const direct = primary.filter((r) => isDirectSourceUrl(r.url));

    if (primary.length > 0 && direct.length === 0) {
      errors.push(
        `Multilingual ${def.slug}: primary reference lacks direct URL`,
      );
    }

    for (const r of refs) {
      if (r.url && isHomepageOnlyUrl(r.url)) {
        errors.push(`Multilingual ${def.slug} -> ${r.id}: homepage-only URL (${r.url})`);
      }
    }

    for (const s of def.sources ?? []) {
      if (s.url && isHomepageOnlyUrl(s.url)) {
        warnings.push(`Multilingual ${def.slug} source "${s.title}": homepage-only (${s.url})`);
      }
    }
  }

  console.log("=== Motive Index Reference URL Validation ===\n");
  console.log(`Reference overrides: ${Object.keys(CASE_REFERENCE_OVERRIDES).length}`);
  console.log(`Multilingual defs: ${MULTILINGUAL_CASE_DEFS.length}`);
  console.log();
  console.log(`ERRORS: ${errors.length}`);
  errors.forEach((e) => console.log("  ✗", e));
  console.log(`\nWARNINGS: ${warnings.length}`);
  warnings.slice(0, 20).forEach((w) => console.log("  ⚠", w));
  if (warnings.length > 20) console.log(`  ... and ${warnings.length - 20} more`);

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
