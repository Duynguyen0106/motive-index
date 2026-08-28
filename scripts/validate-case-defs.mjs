#!/usr/bin/env node
/**
 * Definition-time validation — blocks fabricated or unverified case defs
 * before they enter the seed pipeline.
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
  const { validateCaseDef } = await import(join(root, "src/lib/validation/caseProvenance.ts"));
  const { WORLD_CASE_DEFS, IMPORTED_WIKIDATA_DEFS } = await import(join(root, "src/data/worldCases.ts"));
  const { MULTILINGUAL_CASE_DEFS } = await import(join(root, "src/data/multilingualCases.ts"));
  const { CASE_REFERENCE_OVERRIDES } = await import(join(root, "src/data/caseReferenceCatalog.ts"));

  const errors = [];
  const warnings = [];
  const slugSet = new Map();

  function collect(slug, violations) {
    for (const v of violations) {
      if (v.level === "error") errors.push(`[${slug}] ${v.message}`);
      else warnings.push(`[${slug}] ${v.message}`);
    }
  }

  for (const d of WORLD_CASE_DEFS) {
    slugSet.set(d.slug, (slugSet.get(d.slug) ?? 0) + 1);
    collect(
      d.slug,
      validateCaseDef(
        {
          slug: d.slug,
          name: d.name,
          offenderName: d.offenderName,
          yearStart: d.yearStart,
          yearEnd: d.yearEnd,
          overview: d.overview,
          tags: d.tags,
        },
        { multilingual: false },
      ),
    );
  }

  for (const d of IMPORTED_WIKIDATA_DEFS) {
    slugSet.set(d.slug, (slugSet.get(d.slug) ?? 0) + 1);
    collect(
      d.slug,
      validateCaseDef(
        {
          slug: d.slug,
          name: d.name,
          offenderName: d.offenderName,
          yearStart: d.yearStart,
          yearEnd: d.yearEnd,
          overview: d.overview,
          tags: d.tags,
        },
        { multilingual: false },
      ),
    );
  }

  for (const d of MULTILINGUAL_CASE_DEFS) {
    slugSet.set(d.slug, (slugSet.get(d.slug) ?? 0) + 1);
    collect(
      d.slug,
      validateCaseDef(
        {
          slug: d.slug,
          name: d.name,
          offenderName: d.offenderName,
          yearStart: d.yearStart,
          yearEnd: d.yearEnd,
          overview: d.overview,
          tags: d.tags,
          references: d.references,
          sources: d.sources,
        },
        { multilingual: true },
      ),
    );
  }

  for (const [slug, n] of slugSet) {
    if (n > 1) errors.push(`Duplicate def slug across catalogs: ${slug} (${n}x)`);
  }

  const nameGroups = new Map();
  for (const d of [...WORLD_CASE_DEFS, ...MULTILINGUAL_CASE_DEFS]) {
    const key = d.name.toLowerCase().trim();
    if (!nameGroups.has(key)) nameGroups.set(key, []);
    nameGroups.get(key).push(d.slug);
  }
  for (const [name, slugs] of nameGroups) {
    if (slugs.length > 1) {
      errors.push(`Duplicate display name across defs: "${name}" -> ${slugs.join(", ")}`);
    }
  }

  console.log("=== Motive Index Case Definition Validation ===\n");
  console.log(`World defs: ${WORLD_CASE_DEFS.length}`);
  console.log(`Imported Wikidata defs: ${IMPORTED_WIKIDATA_DEFS.length}`);
  console.log(`Multilingual defs: ${MULTILINGUAL_CASE_DEFS.length}`);
  console.log(`Reference overrides: ${Object.keys(CASE_REFERENCE_OVERRIDES).length}`);
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
