#!/usr/bin/env node
/**
 * Supplement Wikidata import with English Wikipedia crime category members.
 * Each article URL is a specific public-record page — not fabricated.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "src/data/imported");
const CASES_OUT = path.join(OUT_DIR, "wikidataCases.generated.json");
const REFS_OUT = path.join(OUT_DIR, "wikidataReferences.generated.json");

const TARGET = Number(process.env.IMPORT_TARGET ?? 10000);
const USER_AGENT = "MotiveIndexImport/1.1 (https://github.com/Duynguyen0106/motive-index)";

const ROOT_CATEGORIES = [
  { id: "serial_killers", title: "Category:Serial killers", crimeCategories: ["serial_murder"], maxDepth: 3 },
  { id: "mass_murder", title: "Category:Mass murder", crimeCategories: ["mass_violence"], maxDepth: 3 },
  { id: "mass_shootings", title: "Category:Mass shootings", crimeCategories: ["mass_violence"], maxDepth: 3 },
  { id: "school_shootings", title: "Category:School shootings", crimeCategories: ["mass_violence"], maxDepth: 3 },
  { id: "assassinations", title: "Category:Assassinations", crimeCategories: ["homicide"], maxDepth: 2 },
  { id: "terrorist_incidents", title: "Category:Terrorist incidents by country", crimeCategories: ["terrorism_ideological"], maxDepth: 3 },
  { id: "massacres", title: "Category:Massacres", crimeCategories: ["mass_violence"], maxDepth: 3 },
  { id: "genocides", title: "Category:Genocides", crimeCategories: ["mass_violence"], maxDepth: 2 },
  { id: "familicides", title: "Category:Familicides", crimeCategories: ["domestic_homicide"], maxDepth: 2 },
  { id: "murderers", title: "Category:Murderers by nationality", crimeCategories: ["homicide"], maxDepth: 3 },
  { id: "spree_killings", title: "Category:Spree shootings", crimeCategories: ["mass_violence"], maxDepth: 2 },
  { id: "domestic_violence", title: "Category:Deaths from domestic violence", crimeCategories: ["domestic_homicide"], maxDepth: 2 },
  { id: "war_crimes", title: "Category:War crimes", crimeCategories: ["mass_violence"], maxDepth: 2 },
  { id: "unsolved_murders", title: "Category:Unsolved murders", crimeCategories: ["homicide"], maxDepth: 2 },
];

const VALID_COUNTRY_CODES = new Set([
  "US", "GB", "CA", "AU", "DE", "FR", "OTHER",
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugFromTitle(title) {
  return title
    .replace(/ /g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeName(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function fetchCategoryMembers(categoryTitle, cmtype = "page|subcat") {
  const members = [];
  let cmcontinue;
  do {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: categoryTitle,
      cmlimit: "500",
      cmtype,
      format: "json",
    });
    if (cmcontinue) params.set("cmcontinue", cmcontinue);
    const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`);
    members.push(...(data.query?.categorymembers ?? []));
    cmcontinue = data.continue?.cmcontinue;
    await sleep(250);
  } while (cmcontinue);
  return members;
}

async function collectPagesRecursive(rootTitle, maxDepth) {
  const pages = new Map();
  const visited = new Set();
  const queue = [{ title: rootTitle, depth: 0 }];

  while (queue.length) {
    const { title, depth } = queue.shift();
    if (visited.has(title)) continue;
    visited.add(title);

    let members;
    try {
      members = await fetchCategoryMembers(title, "page|subcat");
    } catch {
      continue;
    }

    for (const m of members) {
      if (m.title.startsWith("Category:")) {
        if (depth < maxDepth) queue.push({ title: m.title, depth: depth + 1 });
      } else if (!m.title.startsWith("List of ") && !m.title.includes("(disambiguation)")) {
        pages.set(m.pageid, { title: m.title, pageid: m.pageid });
      }
    }
    await sleep(200);
  }

  return [...pages.values()];
}

async function fetchExtracts(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const params = new URLSearchParams({
      action: "query",
      prop: "extracts|coordinates",
      exintro: "1",
      explaintext: "1",
      exsentences: "3",
      titles: chunk.join("|"),
      format: "json",
    });
    const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`);
    for (const page of Object.values(data.query?.pages ?? {})) {
      if (page.missing) continue;
      out.set(page.title, {
        extract: page.extract ?? "",
        lat: page.coordinates?.[0]?.lat,
        lng: page.coordinates?.[0]?.lon,
      });
    }
    await sleep(350);
  }
  return out;
}

function inferCountry(title, extract) {
  const t = `${title} ${extract}`.toLowerCase();
  if (/\b(united states|u\.s\.|american|california|texas|florida)\b/.test(t)) return "US";
  if (/\b(united kingdom|british|england|scotland|wales)\b/.test(t)) return "GB";
  if (/\b(canada|canadian)\b/.test(t)) return "CA";
  if (/\b(australia|australian)\b/.test(t)) return "AU";
  if (/\b(germany|german)\b/.test(t)) return "DE";
  if (/\b(france|french)\b/.test(t)) return "FR";
  return "OTHER";
}

function inferYear(title, extract) {
  const m = extract.match(/\b(1[89]\d{2}|20[0-2]\d)\b/) ?? title.match(/\b(1[89]\d{2}|20[0-2]\d)\b/);
  return m ? Number(m[1]) : 1900;
}

async function main() {
  let cases = JSON.parse(fs.readFileSync(CASES_OUT, "utf8"));
  let refs = JSON.parse(fs.readFileSync(REFS_OUT, "utf8"));
  const existingSlugs = new Set(cases.map((c) => c.slug));
  const existingNames = new Set(cases.map((c) => normalizeName(c.name)));

  for (const src of ["src/data/worldCases.ts", "src/data/multilingualCases.ts", "src/data/seed.ts"]) {
    const text = fs.readFileSync(path.join(ROOT, src), "utf8");
    for (const m of text.matchAll(/slug:\s*["']([^"']+)["']/g)) existingSlugs.add(m[1]);
    for (const m of text.matchAll(/name:\s*["']([^"']+)["']/g)) existingNames.add(normalizeName(m[1]));
  }

  console.log(`Starting Wikipedia category supplement: ${cases.length} existing, target ${TARGET}`);

  for (const cat of ROOT_CATEGORIES) {
    if (cases.length >= TARGET) break;
    console.log(`\nCategory tree: ${cat.title} (depth ${cat.maxDepth})`);
    let members;
    try {
      members = await collectPagesRecursive(cat.title, cat.maxDepth);
    } catch (e) {
      console.warn(`  Skip ${cat.title}: ${e.message}`);
      continue;
    }
    console.log(`  Pages collected: ${members.length}`);

    const titles = members.map((m) => m.title);
    let meta;
    try {
      meta = await fetchExtracts(titles);
    } catch (e) {
      console.warn(`  Extracts failed: ${e.message}`);
      continue;
    }

    let added = 0;
    for (const m of members) {
      if (cases.length >= TARGET) break;
      const title = m.title;
      const slug = slugFromTitle(title);
      if (!slug || existingSlugs.has(slug)) continue;
      const norm = normalizeName(title);
      if (existingNames.has(norm)) continue;

      const info = meta.get(title) ?? { extract: "" };
      const extract = info.extract?.trim() ?? "";
      if (extract.length < 20) continue;
      if (/\b(disambiguation|album|film|podcast|record label)\b/i.test(extract.slice(0, 120))) continue;

      const country = inferCountry(title, extract);
      const yearStart = inferYear(title, extract);
      const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

      const def = {
        slug,
        name: title,
        subtitle: `${cat.id.replace(/_/g, " ")} — Wikipedia public record`,
        country: VALID_COUNTRY_CODES.has(country) ? country : "OTHER",
        location: country === "OTHER" ? "See Wikipedia article" : `${country} (see Wikipedia)`,
        jurisdiction: country === "US" ? "United States" : country,
        yearStart,
        era: `${Math.floor(yearStart / 10) * 10}s`,
        status: extract.toLowerCase().includes("unsolved") ? "unsolved" : yearStart < 1950 ? "historical" : "closed",
        crimeCategories: cat.crimeCategories,
        overview: `${extract.slice(0, 400).trim()} Summary sourced from English Wikipedia (${articleUrl}); verify facts against primary court or inquiry records before academic citation. Import category: ${cat.id}.`,
        offenderName: title,
        tags: ["wikipedia-import", "wikipedia-sourced", cat.id.replace(/_/g, "-")],
        lat: info.lat ?? 20,
        lng: info.lng ?? 0,
      };

      refs[slug] = [
        {
          id: `ref-${slug}-wiki`,
          citation: `${title} — English Wikipedia article.`,
          kind: "media",
          url: articleUrl,
          note: "Wikipedia category import; confirm forensic claims against court records and primary press archives.",
        },
      ];

      cases.push(def);
      existingSlugs.add(slug);
      existingNames.add(norm);
      added++;
    }
    console.log(`  Added ${added} (total ${cases.length})`);
    await sleep(500);
  }

  cases.sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(CASES_OUT, JSON.stringify(cases));
  fs.writeFileSync(REFS_OUT, JSON.stringify(refs));
  console.log(`\nDone: ${cases.length} total cases`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
