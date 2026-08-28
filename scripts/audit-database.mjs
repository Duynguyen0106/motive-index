#!/usr/bin/env node
/**
 * Audit Motive Index case catalog for data integrity and accuracy labeling.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const FLAGSHIP_SLUG_IDS = new Set([
  "case-bundy",
  "case-rader",
  "case-kaczynski",
  "case-zodiac",
  "case-wuornos",
  "case-manson",
  "case-shipman",
]);

/** Fresh seed — ignore stale .data/store.json from dev/verify runs. */
async function useFreshSeed() {
  const { resetStore } = await import(join(root, "src/lib/data.ts"));
  resetStore();
}

async function main() {
  await useFreshSeed();
  const { getAllCases } = await import(join(root, "src/lib/data.ts"));
  const { isCompositeCase } = await import(join(root, "src/lib/caseSummaries.ts"));
  const { resolveCaseCountry } = await import(join(root, "src/lib/country.ts"));
  const { getCatalogCoords } = await import(join(root, "src/lib/geo.ts"));
  const { WORLD_CASE_DEFS, IMPORTED_WIKIDATA_DEFS } = await import(join(root, "src/data/worldCases.ts"));
  const { RETIRED_WORLD_SLUGS } = await import(join(root, "src/lib/validation/retiredSlugs.ts"));
  const { validateProvenance, COMPOSITE_NAME_PREFIXES } = await import(
    join(root, "src/lib/validation/caseProvenance.ts")
  );

  const cases = getAllCases();
  const errors = [];
  const warnings = [];

  const slugSet = new Map();
  const idSet = new Map();

  for (const c of cases) {
    slugSet.set(c.slug, (slugSet.get(c.slug) ?? 0) + 1);
    idSet.set(c.id, (idSet.get(c.id) ?? 0) + 1);
  }

  for (const [slug, n] of slugSet) {
    if (n > 1) errors.push(`Duplicate slug: ${slug} (${n}x)`);
  }
  for (const [id, n] of idSet) {
    if (n > 1) errors.push(`Duplicate id: ${id} (${n}x)`);
  }

  for (const slug of RETIRED_WORLD_SLUGS) {
    if (slugSet.has(slug)) {
      errors.push(`Retired duplicate world slug still present: ${slug}`);
    }
  }

  const composite = cases.filter(isCompositeCase);
  const curated = cases.filter((c) => !isCompositeCase(c));

  for (const c of composite) {
    if (!c.tags.includes("bulk-catalog")) {
      warnings.push(`Composite missing bulk-catalog tag: ${c.slug}`);
    }
    if (!c.tags.includes("composite-dossier")) {
      warnings.push(`Composite missing composite-dossier tag: ${c.slug}`);
    }
    if (!c.tags.includes("synthetic-subject")) {
      warnings.push(`Composite missing synthetic-subject tag: ${c.slug}`);
    }
    if (!c.overview.toLowerCase().includes("composite")) {
      errors.push(`Composite overview lacks disclaimer: ${c.slug}`);
    }
    if (!c.name.startsWith("Archival prosecution:") && !c.name.startsWith("Unsolved matter:")) {
      warnings.push(`Composite name format unexpected: ${c.slug} -> ${c.name}`);
    }
    if (!/^CS-\d{4}$/.test(c.name.split(": ").pop()?.trim() ?? "")) {
      errors.push(`Composite subject id format invalid: ${c.slug} -> ${c.name}`);
    }
    const compositeViolations = validateProvenance({
      slug: c.slug,
      tags: c.tags,
      name: c.name,
    }).filter((v) => v.level === "error");
    for (const v of compositeViolations) errors.push(v.message);
    if (c.featured) {
      errors.push(`Composite case marked featured: ${c.slug}`);
    }
    if (c.caseOfWeek) {
      errors.push(`Composite case marked caseOfWeek: ${c.slug}`);
    }
  }

  for (const c of curated) {
    if (c.tags.includes("bulk-catalog")) {
      errors.push(`Curated case has bulk-catalog tag: ${c.slug}`);
    }
    if (COMPOSITE_NAME_PREFIXES.some((p) => c.name.startsWith(p))) {
      errors.push(`Curated case uses composite name prefix: ${c.slug}`);
    }
    const provenanceErrors = validateProvenance({
      slug: c.slug,
      tags: c.tags,
      references: c.references,
      offenderName: c.offenders?.[0]?.name,
      name: c.name,
      analysisStatus: c.analysis?.status,
    }).filter((v) => v.level === "error");
    for (const v of provenanceErrors) {
      if (!v.message.includes("Slug/offender")) errors.push(v.message);
    }
  }

  // Duplicate display names across curated cases (same person, different slugs)
  const topicGroups = new Map();
  for (const c of curated) {
    const key = c.name.toLowerCase().replace(/\s+/g, " ").trim();
    if (!topicGroups.has(key)) topicGroups.set(key, []);
    topicGroups.get(key).push(c.slug);
  }
  for (const [name, slugs] of topicGroups) {
    if (slugs.length > 1) {
      errors.push(`Duplicate curated display name: "${name}" -> ${slugs.join(", ")}`);
    }
  }

  for (const c of cases) {
    const isDraftStub =
      c.tags.includes("draft") &&
      c.analysis?.status === "pending" &&
      !c.analysis?.constructs?.length;

    if (!c.slug?.match(/^[a-z0-9-]+$/)) {
      errors.push(`Invalid slug format: ${c.slug}`);
    }
    if (c.id !== `case-${c.slug}` && !FLAGSHIP_SLUG_IDS.has(c.id) && !c.slug.includes("draft")) {
      warnings.push(`Id/slug mismatch: id=${c.id} slug=${c.slug}`);
    }
    if (c.yearStart < 1700 || c.yearStart > 2026) {
      errors.push(`Year out of range: ${c.slug} yearStart=${c.yearStart}`);
    }
    if (c.yearEnd && c.yearEnd < c.yearStart) {
      errors.push(`yearEnd before yearStart: ${c.slug}`);
    }
    if (!c.analysis?.constructs?.length && !isDraftStub) {
      errors.push(`No analysis constructs: ${c.slug}`);
    }
    if (!c.narrative?.chapters?.length && !c.slug.includes("draft")) {
      warnings.push(`No narrative chapters: ${c.slug}`);
    }
    if (!c.references?.length && !isDraftStub) {
      warnings.push(`No references: ${c.slug}`);
    }
    const country = resolveCaseCountry(c);
    if (country === "OTHER" && !isCompositeCase(c) && !isDraftStub) {
      warnings.push(`Curated case with OTHER country: ${c.slug}`);
    }
    if ((c.lat == null || c.lng == null) && !isDraftStub) {
      const coords = getCatalogCoords(c.slug);
      if (!coords) {
        warnings.push(`No coordinates: ${c.slug}`);
      } else {
        warnings.push(`Coordinates not propagated to case object: ${c.slug}`);
      }
    }
  }

  const bulkSlugs = new Set(
    JSON.parse(readFileSync(join(root, "src/data/bulkCaseDefs.generated.json"), "utf8")).map((d) => d.slug),
  );

  console.log("=== Motive Index Database Audit ===\n");
  console.log(`Total cases: ${cases.length}`);
  console.log(`Curated: ${curated.length}`);
  console.log(`Composite: ${composite.length}`);
  console.log(`World hand-curated defs: ${WORLD_CASE_DEFS.length}`);
  console.log(`Wikidata imported defs: ${IMPORTED_WIKIDATA_DEFS.length}`);
  console.log(`Bulk JSON (retired, not loaded): ${bulkSlugs.size}`);
  console.log(
    `Expected total: ${8 + WORLD_CASE_DEFS.length + IMPORTED_WIKIDATA_DEFS.length + 38} (flagship+draft + world + import + multilingual)`,
  );
  console.log();

  console.log(`ERRORS: ${errors.length}`);
  errors.slice(0, 40).forEach((e) => console.log("  ✗", e));
  if (errors.length > 40) console.log(`  ... and ${errors.length - 40} more`);

  console.log(`\nWARNINGS: ${warnings.length}`);
  warnings.slice(0, 30).forEach((w) => console.log("  ⚠", w));
  if (warnings.length > 30) console.log(`  ... and ${warnings.length - 30} more`);

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
