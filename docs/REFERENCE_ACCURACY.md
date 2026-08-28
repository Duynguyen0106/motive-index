# Reference accuracy framework

Motive Index separates **verified public-record dossiers** from **teaching templates** and **composite archive stubs**. This document describes how references are classified, validated, and shown in the UI.

## Quality tiers

Every `CaseReference` is classified by `src/lib/validation/referenceAccuracy.ts`:

| Tier | Meaning | UI badge |
|------|---------|----------|
| **primary-direct** | Court, media, or report citation with a URL that opens case-specific content | Primary source |
| **primary-offline** | Court/media/report without a URL (e.g. book-only trial record) | Primary record |
| **secondary-scholarly** | Books, journals, FBI monographs — useful context, not sole proof | Secondary source |
| **synthetic-template** | `[Template]` teaching placeholders for composite/curated cases | Teaching template |
| **invalid** | Homepage-only URL, or primary kind with bad link | Needs review |

## Provenance ↔ reference rules

| Provenance tier | Reference requirements |
|-----------------|------------------------|
| **verified** | ≥1 **primary-direct** URL; no unmarked templates; multilingual cases also need `originalCitation` on a primary ref |
| **curated** | Real case identity; templates allowed but flagged; warning if *only* templates |
| **composite** | Templates expected; direct primary URLs are unusual (warning) |
| **draft** | Not gated for publication |

Verified cases are backed by:

- `CASE_REFERENCE_OVERRIDES` in `src/data/caseReferenceCatalog.ts` (51 flagship/world cases), or
- `MULTILINGUAL_CASE_DEFS` in `src/data/multilingualCases.ts` with original-language citations.

## Validation pipeline

Run before every catalog commit:

```bash
npm run validate:catalog
```

Reference-specific steps:

1. **Reference accuracy** (`validate-reference-accuracy.mjs`) — citations, URLs, tier alignment, duplicate URLs, publisher/citation mismatches
2. **Reference URL shape** (`validate-reference-urls.mjs`) — no homepage-only links in verified catalogs
3. **Live HTTP audit** (`audit-reference-links.mjs`) — 145 URLs fetched; retries; redirect-to-homepage detection

Individual scripts:

```bash
npx tsx scripts/validate-reference-accuracy.mjs
npx tsx scripts/validate-reference-urls.mjs
npx tsx scripts/audit-reference-links.mjs
```

## Adding a verified case

1. Add a `CASE_REFERENCE_OVERRIDES["your-slug"]` entry with at least one **court**, **media**, or **report** ref that includes:
   - `url` — direct link (article, docket summary, inquiry page — not a publisher homepage)
   - `note` — why this source matters forensically
   - `citation` — accurate bibliographic text matching the URL
2. Run `npm run validate:catalog` — must pass with **0 errors**
3. Optional: run live link audit after URL changes

Example:

```typescript
"your-slug": [
  {
    id: "ref-your-slug-trial",
    citation: "People v. Offender (2010) — County Superior Court.",
    kind: "court",
    year: "2010",
    url: "https://en.wikipedia.org/wiki/…", // or direct court/press URL
    note: "Conviction record for behavioral claims in this dossier.",
  },
],
```

## UI behavior

On the dossier **References** tab:

- **Open primary source** button appears when a primary-direct reference exists
- Each row shows a **quality badge** (`ReferenceQualityBadge.tsx`)
- Teaching templates are labeled so users know not to cite them as verified fact

## Publication gate

`publishCase()` in `src/lib/data.ts` calls:

1. `assertPublishableCase()` — provenance + reference accuracy
2. Rejects cases tagged `public-record` without verified tier
3. Rejects verified/curated cases failing reference accuracy errors

## Anti-patterns (automatically flagged)

- Citation says "New York Times" but URL is `fbi.gov`
- `[Template]` citation without `synthetic: true`
- Verified override with homepage-only URL
- Duplicate URLs within one dossier
- Multilingual case missing `originalCitation`

See also: [DATABASE.md](./DATABASE.md#anti-fabrication-framework)
