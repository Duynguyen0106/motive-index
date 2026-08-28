# Database

Motive Index uses a **local JSON store** (`.data/store.json`) for development and an optional **Supabase Postgres** backend for production.

## Local development

- Data is seeded from `src/data/seed.ts` and catalog enrichments on first run.
- Writes persist atomically to `.data/store.json`.
- In-memory cache is invalidated on `resetStore()` and document uploads.

## Supabase (production)

1. Run `supabase/schema.sql` in the Supabase SQL editor (includes migration 002).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Push local data: `npm run db:sync`
4. Or use admin **POST** `/api/admin/supabase-health` to sync the full store.
5. For production reads from Postgres, set `MOTIVE_INDEX_SUPABASE_READ=1`.

## Tables

| Table | Purpose |
|-------|---------|
| `cases` | Scalar columns + full `CrimeCase` in `payload` jsonb |
| `documents` | Document metadata and storage paths |
| `live_updates` | Revision log and world news feed entries |
| `contributions` | User submission queue |
| `ingest_headlines` | Cross-instance RSS deduplication |

## Migrations

- `supabase/schema.sql` — full schema for new projects
- `supabase/migrations/002_live_updates_contributions_indexes.sql` — incremental upgrade

## Sync coverage

All write paths now sync to Supabase when configured:

- Admin case create / moderate / upload
- Analyze, ingest, contribute APIs
- Live-update ingest worker (cases, updates, headline dedup)
