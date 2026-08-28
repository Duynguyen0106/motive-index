#!/usr/bin/env node
/**
 * Import real public-record cases from Wikidata + English Wikipedia.
 *
 * Each dossier links to a specific Wikipedia article — never procedurally
 * fabricated identities. Non-crime entities (record labels, legal terms, etc.)
 * are filtered out before write.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src/data/imported");
const CASES_OUT = path.join(OUT_DIR, "wikidataCases.generated.json");
const REFS_OUT = path.join(OUT_DIR, "wikidataReferences.generated.json");
const MANIFEST_OUT = path.join(OUT_DIR, "import-manifest.json");

const TARGET = Number(process.env.IMPORT_TARGET ?? 10000);
const USER_AGENT =
  "MotiveIndexImport/1.1 (https://github.com/Duynguyen0106/motive-index; public-record catalog)";

const RETIRED_SLUGS = new Set([
  "javed-iqbal",
  "saeed-hanaei",
  "pedro-lopez",
  "yishai-schlissel",
  "dimitris-papageorgiou",
  "abdul-latif-rashid",
  "mira-bare",
  "volkmar-heinrich",
  "andres-bustamante",
  "gheorghe-solovan",
  "mehmet-oktas",
  "nguyen-thanh-vu",
  "werner-fischer",
  "dimitris-papageorgiou-el",
  "lucjan-staniak",
  "nguyen-tien-dung",
  "laszlo-pandy",
]);

const VALID_COUNTRY_CODES = new Set([
  "AR", "AT", "AU", "BE", "BR", "CA", "CH", "CL", "CN", "CO", "CZ", "DE", "DK", "EG", "ES", "FI",
  "FR", "GB", "GR", "HU", "ID", "IE", "IL", "IN", "IQ", "IR", "IT", "JP", "KE", "KR", "MX", "MY",
  "NG", "NL", "NO", "NZ", "PE", "PH", "PK", "PL", "PT", "RO", "RU", "SE", "SG", "TH", "TR", "TW",
  "UA", "US", "VN", "ZA", "BD", "LV", "ET", "SA", "MK", "RS", "BG", "SK", "UZ", "OTHER",
]);

const COUNTRY_QID_TO_ISO = {
  Q30: "US", Q145: "GB", Q16: "CA", Q17: "JP", Q183: "DE", Q142: "FR", Q38: "IT", Q29: "ES",
  Q55: "NL", Q31: "BE", Q34: "SE", Q20: "NO", Q35: "DK", Q33: "FI", Q40: "AT", Q39: "CH", Q45: "PT",
  Q28: "HU", Q36: "PL", Q213: "CZ", Q218: "RO", Q211: "LV", Q159: "RU", Q212: "UA", Q884: "KR",
  Q148: "CN", Q668: "IN", Q408: "AU", Q664: "NZ", Q96: "MX", Q155: "BR", Q414: "AR", Q739: "CO",
  Q419: "PE", Q79: "EG", Q258: "ZA", Q1033: "NG", Q954: "KE", Q43: "TR", Q41: "GR", Q794: "IR",
  Q796: "IQ", Q843: "PK", Q334: "SG", Q869: "TH", Q881: "VN", Q801: "IL", Q928: "PH", Q252: "ID",
  Q833: "MY", Q902: "BD", Q403: "RS", Q221: "MK", Q219: "BG", Q214: "SK", Q232: "UZ", Q851: "SA",
  Q115: "ET",
};

/** Verified Wikidata type QIDs — crime/incident only. */
const QUERY_PROFILES = [
  {
    id: "serial_killer",
    mode: "person",
    typeQid: "Q484188",
    crimeCategories: ["serial_murder"],
    subtitle: "Serial murder — public record (Wikidata)",
  },
  {
    id: "mass_murderer",
    mode: "person",
    typeQid: "Q15883433",
    crimeCategories: ["mass_violence", "homicide"],
    subtitle: "Mass murder — public record (Wikidata)",
  },
  {
    id: "spree_killer",
    mode: "person",
    typeQid: "Q1154323",
    crimeCategories: ["homicide", "mass_violence"],
    subtitle: "Spree killing — public record (Wikidata)",
  },
  {
    id: "mass_shooting",
    mode: "event",
    typeQid: "Q21480300",
    crimeCategories: ["mass_violence"],
    subtitle: "Mass shooting — public record (Wikidata)",
  },
  {
    id: "mass_murder",
    mode: "event",
    typeQid: "Q750215",
    crimeCategories: ["mass_violence", "homicide"],
    subtitle: "Mass murder incident — public record (Wikidata)",
  },
  {
    id: "school_shooting",
    mode: "event",
    typeQid: "Q473853",
    crimeCategories: ["mass_violence"],
    subtitle: "School shooting — public record (Wikidata)",
  },
  {
    id: "bomb_attack",
    mode: "event",
    typeQid: "Q891854",
    crimeCategories: ["terrorism_ideological", "mass_violence"],
    subtitle: "Bomb attack — public record (Wikidata)",
  },
  {
    id: "assassination",
    mode: "event",
    typeQid: "Q3882219",
    crimeCategories: ["homicide"],
    subtitle: "Assassination — public record (Wikidata)",
  },
  {
    id: "familicide",
    mode: "event",
    typeQid: "Q5400895",
    crimeCategories: ["domestic_homicide", "homicide"],
    subtitle: "Familicide — public record (Wikidata)",
  },
  {
    id: "massacre",
    mode: "event",
    typeQid: "Q3199915",
    crimeCategories: ["mass_violence", "homicide"],
    subtitle: "Massacre — public record (Wikidata)",
  },
  {
    id: "war_crime",
    mode: "event",
    typeQid: "Q135010",
    crimeCategories: ["mass_violence", "terrorism_ideological"],
    subtitle: "War crime — public record (Wikidata)",
  },
  {
    id: "war_crimes_trial",
    mode: "event",
    typeQid: "Q1265353",
    crimeCategories: ["homicide", "mass_violence"],
    subtitle: "War crimes trial — public record (Wikidata)",
  },
];

const BLOCK_DESCRIPTION =
  /\b(record label|music label|album|podcast|legal term|legal concept|syndrome|in physics|video game|television series|film directed|novel by|scots law|property law|international festival)\b/i;
const BLOCK_LABEL =
  /\b(records|record label|syndrome|accession|accord)\b/i;
const BLOCK_SLUG = /(?:^|-)(records|law|syndrome|album|podcast)(?:-|$)/;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeName(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSlugsFromSource(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  return new Set([...src.matchAll(/slug:\s*["']([^"']+)["']/g)].map((m) => m[1]));
}

function buildExistingNames() {
  const names = new Set();
  for (const file of ["src/data/worldCases.ts", "src/data/multilingualCases.ts", "src/data/seed.ts"]) {
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const m of src.matchAll(/name:\s*["']([^"']+)["']/g)) {
      names.add(normalizeName(m[1]));
    }
  }
  return names;
}

function slugFromArticleUrl(url) {
  try {
    const title = decodeURIComponent(new URL(url).pathname.replace(/^\/wiki\//, ""));
    return title
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  } catch {
    return "";
  }
}

function parseCoord(wkt) {
  if (!wkt || typeof wkt !== "string") return null;
  const m = wkt.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  const lng = Number(m[1]);
  const lat = Number(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function yearFromWikidata(value) {
  if (!value) return null;
  const m = String(value).match(/^([+-]?\d{4})/);
  if (!m) return null;
  const y = Number(m[1]);
  if (y < 1700 || y > 2026) return null;
  return y;
}

function eraFromYear(y) {
  const decade = Math.floor(y / 10) * 10;
  return `${decade}s`;
}

function countryFromBinding(b) {
  const iso = b.iso?.value?.trim()?.toUpperCase();
  if (iso && VALID_COUNTRY_CODES.has(iso)) return iso;
  const qid = b.country?.value?.split("/").pop();
  if (qid && COUNTRY_QID_TO_ISO[qid] && VALID_COUNTRY_CODES.has(COUNTRY_QID_TO_ISO[qid])) {
    return COUNTRY_QID_TO_ISO[qid];
  }
  return "OTHER";
}

function defaultCoords(country) {
  const centers = {
    US: { lat: 39.8283, lng: -98.5795 },
    GB: { lat: 54.0, lng: -2.0 },
    DE: { lat: 51.1657, lng: 10.4515 },
    FR: { lat: 46.6034, lng: 1.8883 },
    AU: { lat: -25.2744, lng: 133.7751 },
    CA: { lat: 56.1304, lng: -106.3468 },
  };
  return centers[country] ?? { lat: 20, lng: 0 };
}

function isCrimeEntity(label, description, slug) {
  if (!label || label.length < 2) return false;
  if (RETIRED_SLUGS.has(slug)) return false;
  if (BLOCK_SLUG.test(slug)) return false;
  if (BLOCK_LABEL.test(label) && !/\b(murder|kill|shoot|bomb|attack|massacre|assassin)\b/i.test(label)) {
    return false;
  }
  if (BLOCK_DESCRIPTION.test(description ?? "")) return false;
  if (/^(accession|accord|apollo records|aquarius records)/i.test(label)) return false;
  return true;
}

function buildSparql(profile) {
  const q = profile.typeQid;
  if (profile.mode === "person") {
    return `
SELECT ?item ?itemLabel ?itemDescription ?article ?coord ?country ?iso ?inception ?dissolved WHERE {
  ?item wdt:P31 wd:Q5 .
  { ?item wdt:P106 wd:${q} . } UNION { ?item wdt:P106/wdt:P279* wd:${q} . }
  ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL { ?item wdt:P625 ?coord . }
  OPTIONAL { ?item wdt:P27 ?country . OPTIONAL { ?country wdt:P297 ?iso . } }
  OPTIONAL { ?item wdt:P569 ?inception . }
  OPTIONAL { ?item wdt:P570 ?dissolved . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?item
`;
  }
  return `
SELECT ?item ?itemLabel ?itemDescription ?article ?coord ?country ?iso ?inception WHERE {
  ?item wdt:P31/wdt:P279* wd:${q} .
  ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL { ?item wdt:P625 ?coord . }
  OPTIONAL { ?item wdt:P17 ?country . OPTIONAL { ?country wdt:P297 ?iso . } }
  OPTIONAL { ?item wdt:P585 ?inception . }
  OPTIONAL { ?item wdt:P571 ?inception . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?item
`;
}

async function fetchSparql(query, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch("https://query.wikidata.org/sparql", {
        method: "POST",
        headers: {
          Accept: "application/sparql-results+json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({ query }),
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(10000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await sleep(10000 * (attempt + 1));
    }
  }
}

function buildOverview(label, description, articleUrl, qid, profileId) {
  const desc = description?.trim();
  const base = desc && desc.length > 20 ? desc : `${label} — documented in public record.`;
  return `${base} Summary sourced from Wikidata (${qid}) and English Wikipedia (${articleUrl}); verify facts against primary court, inquiry, or contemporaneous press records before academic citation. Import category: ${profileId.replace(/_/g, " ")}.`;
}

function bindingToCase(binding, profile, existingNames) {
  const qid = binding.item?.value?.split("/").pop() ?? "";
  const label = binding.itemLabel?.value?.trim();
  const articleUrl = binding.article?.value?.trim();
  if (!label || !articleUrl || !qid) return null;

  const slug = slugFromArticleUrl(articleUrl);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;

  const description = binding.itemDescription?.value ?? "";
  if (!isCrimeEntity(label, description, slug)) return null;

  const normName = normalizeName(label);
  if (existingNames.has(normName)) return null;

  const country = countryFromBinding(binding);
  const coord = parseCoord(binding.coord?.value);
  const coords = coord ?? defaultCoords(country);

  const inception = yearFromWikidata(binding.inception?.value);
  const dissolved = yearFromWikidata(binding.dissolved?.value);
  let yearStart = inception ?? 1900;
  let yearEnd = dissolved && dissolved !== yearStart ? dissolved : undefined;
  if (yearEnd != null && yearEnd < yearStart) yearEnd = undefined;

  const text = `${label} ${description}`.toLowerCase();
  let status = "closed";
  if (text.includes("unsolved") || text.includes("unidentified") || text.includes("unknown killer")) {
    status = "unsolved";
  } else if (yearStart < 1950) {
    status = "historical";
  }

  return {
    def: {
      slug,
      name: label,
      subtitle: profile.subtitle,
      country,
      location: country === "OTHER" ? "See Wikipedia article" : `${country} (see Wikipedia)`,
      jurisdiction: country === "US" ? "United States" : country === "GB" ? "United Kingdom" : country,
      yearStart,
      ...(yearEnd ? { yearEnd } : {}),
      era: eraFromYear(yearStart),
      status,
      crimeCategories: profile.crimeCategories,
      overview: buildOverview(label, description, articleUrl, qid, profile.id),
      offenderName: label,
      tags: ["wikidata-import", "wikipedia-sourced", profile.id.replace(/_/g, "-")],
      lat: coords.lat,
      lng: coords.lng,
    },
    ref: {
      id: `ref-${slug}-wiki`,
      citation: `${label} — English Wikipedia article (Wikidata ${qid}).`,
      kind: "media",
      url: articleUrl.split("#")[0],
      note: "Structured metadata import; confirm forensic claims against court records and primary press archives.",
    },
    meta: { qid, articleUrl, profile: profile.id },
  };
}

async function runProfile(profile, existingSlugs, existingNames, seenQids, seenArticles, cases, refs) {
  console.log(`\n=== Profile: ${profile.id} (${profile.typeQid}) ===`);
  let offset = 0;
  const pageSize = 300;
  let profileAdded = 0;

  while (cases.length < TARGET) {
    const pagedQuery = `${buildSparql(profile)}\nLIMIT ${pageSize} OFFSET ${offset}`;
    console.log(`  Fetch offset ${offset}…`);
    let data;
    try {
      data = await fetchSparql(pagedQuery);
    } catch (e) {
      console.warn(`  Stopped at offset ${offset}: ${e.message}`);
      break;
    }

    const bindings = data?.results?.bindings ?? [];
    if (!bindings.length) break;

    let pageAdded = 0;
    for (const b of bindings) {
      if (cases.length >= TARGET) break;
      const qid = b.item?.value?.split("/").pop();
      const article = b.article?.value;
      if (!qid || !article || seenQids.has(qid) || seenArticles.has(article)) continue;

      const row = bindingToCase(b, profile, existingNames);
      if (!row) continue;
      if (existingSlugs.has(row.def.slug)) continue;

      seenQids.add(qid);
      seenArticles.add(article);
      existingSlugs.add(row.def.slug);
      existingNames.add(normalizeName(row.def.name));
      cases.push(row.def);
      refs[row.def.slug] = [row.ref];
      pageAdded++;
      profileAdded++;
    }

    console.log(`  +${pageAdded} page (profile ${profileAdded}, total ${cases.length})`);
    if (bindings.length < pageSize) break;
    offset += pageSize;
    await sleep(6000);
  }

  return profileAdded;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const existingSlugs = new Set([
    ...extractSlugsFromSource(path.join(ROOT, "src/data/worldCases.ts")),
    ...extractSlugsFromSource(path.join(ROOT, "src/data/multilingualCases.ts")),
    ...extractSlugsFromSource(path.join(ROOT, "src/data/seed.ts")),
  ]);
  const existingNames = buildExistingNames();

  let cases = [];
  let refs = {};
  if (process.env.IMPORT_RESUME === "1" && fs.existsSync(CASES_OUT)) {
    cases = JSON.parse(fs.readFileSync(CASES_OUT, "utf8"));
    refs = JSON.parse(fs.readFileSync(REFS_OUT, "utf8"));
    for (const c of cases) {
      existingSlugs.add(c.slug);
      existingNames.add(normalizeName(c.name));
    }
    console.log(`Resuming: ${cases.length} existing imported cases`);
  } else {
    console.log("Fresh import (set IMPORT_RESUME=1 to merge)");
  }

  console.log(`Hand-curated slugs to skip: ${existingSlugs.size}`);
  console.log(`Target: ${TARGET} imported cases`);

  const seenQids = new Set();
  const seenArticles = new Set();
  for (const c of cases) {
    const m = c.overview?.match(/Wikidata \((Q\d+)\)/);
    if (m) seenQids.add(m[1]);
    const r = refs[c.slug]?.[0]?.url;
    if (r) seenArticles.add(r);
  }

  const profileStats = {};
  const filter = process.env.IMPORT_PROFILES?.split(",").map((s) => s.trim()).filter(Boolean);

  for (const profile of QUERY_PROFILES) {
    if (cases.length >= TARGET) break;
    if (filter?.length && !filter.includes(profile.id)) continue;
    profileStats[profile.id] = await runProfile(
      profile,
      existingSlugs,
      existingNames,
      seenQids,
      seenArticles,
      cases,
      refs,
    );
    await sleep(8000);
  }

  cases.sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(CASES_OUT, JSON.stringify(cases));
  fs.writeFileSync(REFS_OUT, JSON.stringify(refs));
  fs.writeFileSync(
    MANIFEST_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        target: TARGET,
        imported: cases.length,
        profileStats,
        skippedHandCurated: existingSlugs.size,
      },
      null,
      2,
    ),
  );

  console.log(`\nDone: ${cases.length} cases → ${CASES_OUT}`);
  console.log(`References: ${Object.keys(refs).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
