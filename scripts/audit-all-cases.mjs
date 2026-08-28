#!/usr/bin/env node
/**
 * Per-case provenance audit — checks every catalog entry against the
 * anti-fabrication framework and prints a full tier breakdown.
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const { resetStore, getAllCases } = await import(join(root, "src/lib/data.ts"));
  const { isCompositeCase } = await import(join(root, "src/lib/caseSummaries.ts"));
  const {
    resolveProvenanceTier,
    validateProvenance,
    PROVENANCE_TAG,
    isSyntheticReference,
    hasReferenceOverride,
  } = await import(join(root, "src/lib/validation/caseProvenance.ts"));

  resetStore();
  const cases = getAllCases();

  const byTier = { verified: [], curated: [], composite: [], draft: [] };
  const withErrors = [];
  const withWarnings = [];
  const lines = [];

  for (const c of cases) {
    const tier = resolveProvenanceTier({
      slug: c.slug,
      tags: c.tags,
      references: c.references,
      offenderName: c.offenders?.[0]?.name,
      name: c.name,
      analysisStatus: c.analysis?.status,
    });

    byTier[tier].push(c.slug);

    const violations = validateProvenance({
      slug: c.slug,
      tags: c.tags,
      references: c.references,
      offenderName: c.offenders?.[0]?.name,
      name: c.name,
      analysisStatus: c.analysis?.status,
    });

    const errors = violations.filter((v) => v.level === "error");
    const warnings = violations.filter((v) => v.level === "warning");

    if (errors.length) withErrors.push({ slug: c.slug, errors });
    if (warnings.length) withWarnings.push({ slug: c.slug, warnings });

    const refCount = c.references?.length ?? 0;
    const verifiedRefs = (c.references ?? []).filter((r) => !isSyntheticReference(r)).length;
    const hasOverride = hasReferenceOverride(c.slug);
    const tagPublic = c.tags.includes("public-record") ? "yes" : "no";
    const tagVerified = c.tags.includes(PROVENANCE_TAG.verified) ? "yes" : "no";

    lines.push(
      [
        c.slug,
        tier,
        tagVerified,
        tagPublic,
        hasOverride ? "override" : "-",
        `${verifiedRefs}/${refCount}`,
        isCompositeCase(c) ? "composite" : "curated",
        c.name.slice(0, 40),
      ].join("\t"),
    );
  }

  const reportPath = join(root, "scripts/audit-all-cases-report.tsv");
  const header = ["slug", "tier", "provenance-verified", "public-record", "override", "verified/total-refs", "catalog-kind", "name"].join("\t");
  writeFileSync(reportPath, `${header}\n${lines.join("\n")}\n`);

  console.log("=== Per-Case Provenance Audit (all cases) ===\n");
  console.log(`Total cases scanned: ${cases.length}`);
  console.log();
  console.log("By provenance tier:");
  for (const [tier, slugs] of Object.entries(byTier)) {
    console.log(`  ${tier.padEnd(10)} ${slugs.length}`);
  }
  console.log();
  console.log(`Cases with ERRORS:   ${withErrors.length}`);
  withErrors.forEach(({ slug, errors }) => {
    errors.forEach((e) => console.log(`  ✗ [${slug}] ${e.message}`));
  });
  console.log();
  console.log(`Cases with WARNINGS: ${withWarnings.length}`);
  withWarnings.slice(0, 30).forEach(({ slug, warnings }) => {
    warnings.forEach((w) => console.log(`  ⚠ [${slug}] ${w.message}`));
  });
  if (withWarnings.length > 30) {
    console.log(`  ... and ${withWarnings.length - 30} more cases with warnings`);
  }
  console.log();
  console.log(`Full per-case report: ${reportPath}`);

  process.exit(withErrors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
