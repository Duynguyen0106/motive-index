#!/usr/bin/env node
/**
 * Live HTTP audit of all reference/source URLs in verified case catalogs.
 * Checks reachability (2xx/3xx) and flags obvious citation/URL mismatches.
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 15000;
const CONCURRENCY = 4;

async function loadData() {
  const { CASE_REFERENCE_OVERRIDES } = await import(
    join(root, "src/data/caseReferenceCatalog.ts")
  );
  const { MULTILINGUAL_CASE_DEFS } = await import(
    join(root, "src/data/multilingualCases.ts")
  );
  return { CASE_REFERENCE_OVERRIDES, MULTILINGUAL_CASE_DEFS };
}

function collectUrls(CASE_REFERENCE_OVERRIDES, MULTILINGUAL_CASE_DEFS) {
  const entries = [];
  for (const [slug, refs] of Object.entries(CASE_REFERENCE_OVERRIDES)) {
    for (const r of refs) {
      if (r.url?.trim()) {
        entries.push({
          slug,
          refId: r.id,
          citation: r.citation,
          url: r.url.trim(),
          source: r.id.endsWith("-wiki") ? "wikidata-import" : "override",
        });
      }
    }
  }
  for (const def of MULTILINGUAL_CASE_DEFS) {
    for (const r of def.references ?? []) {
      if (r.url?.trim()) {
        entries.push({
          slug: def.slug,
          refId: r.id,
          citation: r.citation,
          url: r.url.trim(),
          source: "multilingual-ref",
        });
      }
    }
    for (const s of def.sources ?? []) {
      if (s.url?.trim()) {
        entries.push({
          slug: def.slug,
          refId: s.title,
          citation: s.title,
          url: s.url.trim(),
          source: "multilingual-source",
        });
      }
    }
  }
  return entries;
}

async function checkUrl(entry, attempt = 1) {
  const { isHomepageOnlyUrl } = await import(
    join(root, "src/lib/validation/referenceUrls.ts")
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(entry.url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MotiveIndexReferenceAudit/1.0; +https://github.com/Duynguyen0106/motive-index)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if ([403, 404, 405, 501].includes(res.status)) {
      res = await fetch(entry.url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MotiveIndexReferenceAudit/1.0; +https://github.com/Duynguyen0106/motive-index)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    }
    clearTimeout(timer);
    const finalUrl = res.url;
    const statusOk = res.status >= 200 && res.status < 400;
    const redirectedHome =
      statusOk && finalUrl !== entry.url && isHomepageOnlyUrl(finalUrl);
    const ok = statusOk && !redirectedHome;
    return {
      ...entry,
      status: res.status,
      finalUrl,
      ok,
      error: !statusOk
        ? `HTTP ${res.status}`
        : redirectedHome
          ? `Redirects to homepage (${finalUrl})`
          : null,
    };
  } catch (e) {
    clearTimeout(timer);
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
      return checkUrl(entry, attempt + 1);
    }
    return {
      ...entry,
      status: 0,
      finalUrl: null,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function runPool(items, fn, concurrency) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
      process.stdout.write(`\rChecked ${Math.min(i, items.length)}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  process.stdout.write("\n");
  return results;
}

/** Flag citations that mention one publisher but URL points elsewhere. */
function citationMismatch(entry) {
  const c = entry.citation.toLowerCase();
  const u = entry.url.toLowerCase();
  const pairs = [
    ["new york times", "nytimes.com"],
    ["journal sentinel", "jsonline.com"],
    ["los angeles times archives", "wikipedia.org"],
    ["fbi —", "fbi.gov"],
    ["fbi /", "wikipedia.org"],
  ];
  for (const [phrase, domain] of pairs) {
    if (c.includes(phrase) && !u.includes(domain.replace("www.", ""))) {
      return `Citation mentions "${phrase}" but URL is not ${domain}`;
    }
  }
  return null;
}

async function main() {
  const { CASE_REFERENCE_OVERRIDES, MULTILINGUAL_CASE_DEFS } = await loadData();
  const entries = collectUrls(CASE_REFERENCE_OVERRIDES, MULTILINGUAL_CASE_DEFS);
  const unique = new Map();
  for (const e of entries) {
    unique.set(`${e.slug}|${e.refId}|${e.url}`, e);
  }
  const list = [...unique.values()];

  const handCurated = list.filter((e) => e.source !== "wikidata-import");
  const imported = list.filter((e) => e.source === "wikidata-import");
  const IMPORT_SAMPLE = Number(process.env.REFERENCE_AUDIT_IMPORT_SAMPLE ?? 150);
  const importedSample =
    imported.length <= IMPORT_SAMPLE
      ? imported
      : imported.sort(() => Math.random() - 0.5).slice(0, IMPORT_SAMPLE);
  const auditList = [...handCurated, ...importedSample];

  console.log("=== Motive Index Reference Link Audit ===\n");
  console.log(`URLs total: ${list.length} (hand-curated ${handCurated.length}, imported ${imported.length})`);
  console.log(`URLs to check: ${auditList.length}${imported.length > IMPORT_SAMPLE ? ` (sampled ${IMPORT_SAMPLE} imported)` : ""}\n`);

  const results = await runPool(auditList, checkUrl, CONCURRENCY);
  const broken = results.filter((r) => !r.ok);
  const mismatches = results
    .map((r) => ({ ...r, mismatch: citationMismatch(r) }))
    .filter((r) => r.mismatch);

  const reportPath = join(root, "scripts/audit-reference-links-report.tsv");
  const lines = [
    "slug\trefId\tsource\tstatus\tok\turl\tfinalUrl\terror\tcitation",
    ...results.map((r) =>
      [
        r.slug,
        r.refId,
        r.source,
        r.status,
        r.ok,
        r.url,
        r.finalUrl ?? "",
        r.error ?? "",
        r.citation.replace(/\t/g, " "),
      ].join("\t"),
    ),
  ];
  writeFileSync(reportPath, lines.join("\n") + "\n");

  console.log(`Broken/unreachable: ${broken.length}`);
  broken.forEach((r) => {
    console.log(`  ✗ [${r.slug}] ${r.refId}: ${r.error} — ${r.url}`);
  });

  console.log(`\nCitation/URL mismatches: ${mismatches.length}`);
  mismatches.forEach((r) => {
    console.log(`  ⚠ [${r.slug}] ${r.refId}: ${r.mismatch}`);
    console.log(`      ${r.url}`);
  });

  console.log(`\nReport: ${reportPath}`);
  process.exit(broken.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
