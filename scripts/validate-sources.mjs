#!/usr/bin/env node
/**
 * Source-accuracy validation for curated catalog entries.
 * Flags wrong-person slugs, synthetic-only references, and slug/offender mismatches.
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Slugs retired for factual inaccuracy — must not reappear. */
const RETIRED_INACCURATE_SLUGS = new Set([
  "abdul-latif-rashid",
  "mira-bare",
  "volkmar-heinrich",
  "andres-bustamante",
  "gheorghe-solovan",
  "mehmet-oktas",
  "nguyen-thanh-vu",
  "werner-fischer",
  "pedro-lopez",
  "javed-iqbal",
  "saeed-hanaei",
  "yishai-schlissel",
  "dimitris-papageorgiou",
]);

const SYNTHETIC_CITATION_MARKERS = [
  "superior court proceedings:",
  "Peer-reviewed case study literature:",
  "Official inquiry, commission report",
];

function normalizeName(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugMatchesOffender(slug, offenderName) {
  if (!offenderName || offenderName === "Unknown") return true;
  const parts = normalizeName(offenderName).split(" ").filter(Boolean);
  if (parts.length === 0) return true;
  const slugNorm = slug.replace(/-/g, " ");
  const last = parts[parts.length - 1];
  const first = parts[0];
  return slugNorm.includes(last) || slugNorm.includes(first);
}

async function main() {
  const { getAllCases } = await import(join(root, "src/lib/data.ts"));
  const { isCompositeCase } = await import(join(root, "src/lib/caseSummaries.ts"));
  const { CASE_REFERENCE_OVERRIDES } = await import(join(root, "src/data/caseReferenceCatalog.ts"));

  const cases = getAllCases();
  const errors = [];
  const warnings = [];

  for (const slug of RETIRED_INACCURATE_SLUGS) {
    if (cases.some((c) => c.slug === slug)) {
      errors.push(`Retired inaccurate slug still in catalog: ${slug}`);
    }
  }

  for (const c of cases) {
    if (isCompositeCase(c)) continue;
    if (c.tags.includes("draft")) continue;

    const offender = c.offenders?.[0]?.name ?? "";
    if (!slugMatchesOffender(c.slug, offender) && !c.tags.includes("multilingual-source")) {
      warnings.push(`Slug/offender mismatch: ${c.slug} vs "${offender}"`);
    }

    const refs = c.references ?? [];
    const hasVerified = refs.some(
      (r) => !r.synthetic && !r.citation.startsWith("[Template]") && r.kind !== "journal",
    );
    const hasOverride = Boolean(CASE_REFERENCE_OVERRIDES[c.slug]?.length);
    const onlySynthetic =
      refs.length > 0 &&
      refs.every((r) => r.synthetic || r.citation.startsWith("[Template]"));

    if (c.tags.includes("public-record") && !hasOverride && onlySynthetic) {
      warnings.push(`Curated case has only template references: ${c.slug}`);
    }

    for (const r of refs) {
      if (
        !r.synthetic &&
        SYNTHETIC_CITATION_MARKERS.some((m) => r.citation.includes(m))
      ) {
        errors.push(`Reference looks synthetic but not flagged: ${c.slug} -> ${r.id}`);
      }
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
