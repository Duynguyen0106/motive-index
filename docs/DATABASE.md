# Database

Motive Index uses a **local JSON store** (`.data/store.json`) for development and an optional **Supabase Postgres** backend for production.

## Case catalog (10,000+ public-record dossiers)

Cases are defined in TypeScript seed modules and merged at runtime:

| Source | File | Count (approx.) |
|--------|------|-----------------|
| Flagship seed | `src/data/seed.ts` | 7 hand-authored + 1 draft stub |
| World catalog | `src/data/worldCases.ts` | 75 hand-curated public-record cases |
| Wikidata import | `src/data/imported/wikidataCases.generated.json` | 9,000+ Wikipedia-sourced cases |
| Multilingual | `src/data/multilingualCases.ts` | 38+ translated-source cases |
| Legacy bulk (retired) | `src/data/bulkCaseDefs.generated.json` | Not loaded — synthetic teaching stubs |

Regenerate Wikidata import (requires network; respects Wikidata rate limits):

```bash
npm run db:import-wikidata
```

Legacy bulk generator (synthetic only — do not use for real cases):

```bash
npm run db:generate-bulk
```

Pipeline:

```
WORLD_CASE_DEFS / MULTILINGUAL_CASE_DEFS / wikidataCases.generated.json / seed.ts
        ↓
applyEnrichment() in src/data/catalog.ts
        ↓
.data/store.json  →  (optional) Supabase cases.payload
```

**Adding hand-curated cases:** add a `WorldCaseDef` to `WORLD_CASE_DEFS` (or `MultilingualCaseDef`) with `slug`, coords (`lat`/`lng`), overview, and a `CASE_REFERENCE_OVERRIDES` entry. Then reseed (below).

**Adding bulk public-record cases:** extend `scripts/import-wikidata-cases.mjs` query profiles or re-run `npm run db:import-wikidata`. Each imported case links to a specific English Wikipedia article — never procedurally fabricated identities.

### Anti-fabrication framework

Curated cases are gated by `src/lib/validation/caseProvenance.ts` and `src/lib/validation/referenceAccuracy.ts`. See **[REFERENCE_ACCURACY.md](./REFERENCE_ACCURACY.md)** for the full reference quality framework.

| Tier | Tag | Requirements |
|------|-----|--------------|
| **verified** | `provenance-verified`, `public-record` | Entry in `CASE_REFERENCE_OVERRIDES` or multilingual primary sources |
| **curated** | `provenance-curated` | Real person/case; no `public-record` until verified |
| **composite** | `provenance-composite` | Bulk CS-#### teaching dossiers only |
| **draft** | `provenance-draft` | Ingest stubs awaiting pipeline gates |

Before committing catalog changes:

```bash
npm run validate:catalog   # defs + audit + sources — no server required
```

Rules enforced:

- Retired slugs (`src/lib/validation/retiredSlugs.ts`) cannot re-enter the catalog
- Multilingual defs must include original-language `sources[]` and `references[]`
- World defs without overrides ship as `provenance-curated`, not `public-record`
- Composite cases cannot be tagged `public-record`
- `publishCase()` rejects cases failing provenance gates
- `upsertCase()` blocks direct publication — only `publishCase()` can set `analysis.status = published`
- Ingest, analyze, extract, and pipeline APIs require `CRON_SECRET` bearer token

### Runtime write security

| Route | Auth | Writes to store |
|-------|------|-----------------|
| `POST /api/ingest` | CRON_SECRET | Draft stub → auto-publish if gates pass |
| `POST /api/analyze` | CRON_SECRET | Analysis draft only |
| `POST /api/extract` | CRON_SECRET | None (extraction only) |
| `POST /api/cron/live-update` | CRON_SECRET | RSS ingest + auto-publish retry |
| `POST /api/pipeline/publish` | CRON_SECRET | Publish when integrity gates pass |
| `POST /api/pipeline/narrative` | CRON_SECRET | Regenerate narrative + optional auto-publish |
| `POST /api/contribute` | Public | Contributions queue only |

Draft/pipeline dossiers are excluded from `sitemap.xml` and carry `noindex` robots metadata until published.

Runtime store check (after ingest or before deploy):

```bash
npm run validate:store
```

## Local development

- Data is seeded from `src/data/seed.ts` and catalog enrichments on first run.
- Reseed: `npm run db:reseed` then restart dev server or `POST /api/reset`.
- Seed store for CI validation: `npm run db:seed-store`.

## Supabase (optional production)

1. Create a Supabase project and run `supabase/schema.sql`.
2. Set env vars (see `.env.example`).
3. Bulk push: `npm run db:sync`.

### Tables

| Table | Purpose |
|-------|---------|
| `cases` | Full case JSON payload |
| `updates` | Live feed / archive activity |
| `contributions` | Public submission queue |
| `documents` | Document metadata |
| `ingest_headlines` | RSS dedupe ledger |

### Views

| View | Purpose |
|------|---------|
| `cases_published` | Published analysis status only |
| `cases_awaiting_moderation` | Draft/pending or `awaiting-moderation` tag |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Secured AI pipeline auth (ingest, analyze, cron) |
| `OPENAI_API_KEY` | LLM narrative and analysis |
| `LIVE_UPDATE_FEEDS` | Comma-separated RSS URLs for live ingest |
| `LIVE_UPDATE_LIMIT` | Max new cases per pipeline run |
| `NEXT_PUBLIC_SUPABASE_*` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side sync |
