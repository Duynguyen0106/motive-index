#!/usr/bin/env node
/**
 * Push local .data/store.json to Supabase (cases, documents, updates, contributions).
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: node scripts/db-sync.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const storePath = path.join(process.cwd(), ".data", "store.json");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!fs.existsSync(storePath)) {
  console.error("No .data/store.json found. Run the app once to seed local data.");
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
const supabase = createClient(url, key, { auth: { persistSession: false } });

function caseRow(c) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    subtitle: c.subtitle,
    jurisdiction: c.jurisdiction,
    location: c.location,
    country: c.country ?? "OTHER",
    year_start: c.yearStart,
    year_end: c.yearEnd ?? null,
    status: c.status,
    crime_categories: c.crimeCategories ?? [],
    overview: c.overview,
    warning: c.warning,
    payload: c,
    updated_at: new Date().toISOString(),
  };
}

let cases = 0;
let documents = 0;
let updates = 0;
let contributions = 0;
const errors = [];

for (const c of store.cases ?? []) {
  const { error } = await supabase.from("cases").upsert(caseRow(c), { onConflict: "id" });
  if (error) errors.push(`case ${c.id}: ${error.message}`);
  else cases += 1;
}

for (const d of store.documents ?? []) {
  const crimeCase = (store.cases ?? []).find((c) => c.slug === d.caseSlug);
  if (!crimeCase) continue;
  const { error } = await supabase.from("documents").upsert(
    {
      id: d.id,
      case_id: crimeCase.id,
      case_slug: d.caseSlug,
      title: d.title,
      type: d.type,
      date: d.date ?? null,
      author: d.author ?? null,
      source: d.source,
      public_domain: d.publicDomain,
      summary: d.summary,
      psych_relevance: d.psychRelevance,
      content_warning: d.contentWarning,
      url: d.url ?? null,
      hosted: d.hosted,
    },
    { onConflict: "id" },
  );
  if (error) errors.push(`document ${d.id}: ${error.message}`);
  else documents += 1;
}

for (const u of store.updates ?? []) {
  const { error } = await supabase.from("live_updates").upsert(
    {
      id: u.id,
      created_at: u.createdAt,
      headline: u.headline,
      summary: u.summary,
      case_slug: u.caseSlug ?? null,
      kind: u.kind,
      status: u.status,
      country: u.country ?? null,
      region: u.region ?? null,
      source_url: u.sourceUrl ?? null,
      source_name: u.sourceName ?? null,
      language: u.language ?? null,
      language_label: u.languageLabel ?? null,
      original_headline: u.originalHeadline ?? null,
      payload: u,
    },
    { onConflict: "id" },
  );
  if (error) errors.push(`update ${u.id}: ${error.message}`);
  else updates += 1;
}

for (const c of store.contributions ?? []) {
  const { error } = await supabase.from("contributions").upsert(
    {
      id: c.id,
      kind: c.kind,
      title: c.title,
      submitter_name: c.submitterName,
      submitter_role: c.submitterRole,
      summary: c.summary,
      status: c.status,
      created_at: c.createdAt,
      payload: c,
    },
    { onConflict: "id" },
  );
  if (error) errors.push(`contribution ${c.id}: ${error.message}`);
  else contributions += 1;
}

console.log(JSON.stringify({ cases, documents, updates, contributions, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
