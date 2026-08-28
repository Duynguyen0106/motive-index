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
| **draft** | `provenance-draft` | Ingest/admin stubs |

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
- `upsertCase()` blocks direct publication — only `publishCase()` (moderation approve) can set `analysis.status = published`
- Ingest, analyze, and extract APIs require admin session or `CRON_SECRET` bearer token

### Runtime write security

| Route | Auth | Writes to store |
|-------|------|-----------------|
| `POST /api/ingest` | Admin or CRON_SECRET | Draft stub → moderation queue |
| `POST /api/analyze` | Admin or CRON_SECRET | Analysis draft only |
| `POST /api/extract` | Admin or CRON_SECRET | None (extraction only) |
| `POST /api/admin/moderate` | Admin | Approve → `publishCase()` gate |
| `POST /api/contribute` | Public | Contributions queue only |

Draft/moderation dossiers are excluded from `sitemap.xml` and carry `noindex` robots metadata.


- Data is seeded from `src/data/seed.ts` and catalog enrichments on first run.
- Writes persist atomically to `.data/store.json`.
- In-memory cache is invalidated on `resetStore()` and document uploads.

### Reseed after catalog changes

```bash
npm run db:reseed    # deletes .data/store.json
# then restart dev server OR:
curl -X POST http://localhost:3000/api/reset
```

Code changes to `worldCases.ts` / `multilingualCases.ts` do **not** update an existing store until reseed.

## Supabase (production)

1. Run `supabase/schema.sql` in the Supabase SQL editor (includes migrations 002–003).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Push local data: `npm run db:sync`
4. Or use admin **POST** `/api/admin/supabase-health` to sync the full store.
5. For production reads from Postgres, set `MOTIVE_INDEX_SUPABASE_READ=1`.

### Read path

`src/lib/dataServer.ts` loads from Supabase when `MOTIVE_INDEX_SUPABASE_READ=1` and rows exist; otherwise falls back to local JSON.

### Write path

1. All writes go to local JSON first (`upsertCase`, APIs, ingest worker).
2. If Supabase env vars are set, `src/lib/dbSync.ts` fire-and-forgets upserts (errors logged in dev).
3. Bulk push: `npm run db:sync` or admin POST `/api/admin/supabase-health`.

Server writes use the **service role key** (bypasses RLS). The anon key is read-only via public SELECT policies.

## Tables

| Table | Purpose |
|-------|---------|
| `cases` | Scalar columns + full `CrimeCase` in `payload` jsonb |
| `documents` | Document metadata and `storage_path` for admin uploads |
| `live_updates` | Revision log and world news feed entries |
| `contributions` | User submission queue |
| `ingest_headlines` | Cross-instance RSS deduplication (runtime; not in `db:sync`) |

## Views

| View | Purpose |
|------|---------|
| `cases_published` | `analysis.status = 'published'` |
| `cases_awaiting_moderation` | Draft/pending analysis or `awaiting-moderation` tag |

## Migrations

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Full schema for new projects |
| `supabase/migrations/002_live_updates_contributions_indexes.sql` | Live feed, contributions, core indexes |
| `supabase/migrations/003_featured_analysis_indexes.sql` | Featured + published analysis indexes |

## Sync coverage

All write paths sync to Supabase when configured:

- Admin case create / moderate / upload
- Analyze, ingest, contribute APIs
- Live-update ingest worker (cases, updates, headline dedup via `ingest_headlines`)

`ingest_headlines` is written at ingest time only — not included in `npm run db:sync`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes / sync |
| `MOTIVE_INDEX_SUPABASE_READ=1` | Prefer Postgres reads |
| `OPENAI_API_KEY` | Optional LLM analysis regeneration |
| `CRON_SECRET` | Protect `/api/cron/live-update` |
| `ADMIN_EMAIL` | Admin login allowlist |
