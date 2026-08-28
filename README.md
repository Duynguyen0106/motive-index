# Motive Index

Educational research archive for **historical crime case files** and **forensic psychological analysis** — centered on a live **World Crime Monitor** with map, filters, and global news.

Built for students, academics, researchers, and scholarly readers—with content warnings, citation discipline, and an explicitly non-sensational academic design.

## Product scope

| Area | Status |
|------|--------|
| World Crime Monitor (homepage map + filters) | ✅ `/` |
| Case archive (100+ dossiers, multilingual) | ✅ `/archive` |
| Advanced search & filters | ✅ `/search` |
| Live global crime news (17 RSS regions) | ✅ `/live` |
| Deep dossiers + translated sources | ✅ case pages |
| Document library | ✅ `/documents` |
| Contributions | ✅ `/contribute` |
| Secured AI pipeline (ingest + auto-publish) | ✅ CRON_SECRET APIs |
| SEO (sitemap, robots, OG) | ✅ |
| Auth, Postgres, Elasticsearch | 🔜 production phase |

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
cp .env.example .env.local
# Optional: OPENAI_API_KEY, NEXT_PUBLIC_SITE_URL, Supabase vars
npm run verify   # 75+ integration checks (resets local .data store)
npm run build
```

## Primary routes

| Route | Purpose |
|-------|---------|
| `/` | **World Crime Monitor** — map, filters, news, signals |
| `/archive` | Case index with keyword/country/crime filters (URL-synced) |
| `/cases/[slug]?tab=` | Dossier: story · overview · timeline · psychology · documents · references |
| `/search` | Advanced filters (psych factors, theories, diagnosis, docs) |
| `/live` | Global crime news feed + archive revision log |
| `/monitor` | Legacy redirect → `/` |
| `/cases` | Legacy redirect → `/archive` |

### Monitor deep links

```
/?country=US&crimeCategory=serial_murder&status=unsolved
/?case=ted-bundy&tab=cases
/?tab=news
```

### Keyboard shortcuts

Press **`?`** anywhere (outside form fields) for the full list. Highlights:

- **`/`** — jump to advanced search
- **`g` `m`** — monitor · **`g` `a`** — archive · **`g` `n`** — news · **`g` `s`** — search
- **`←` `→`** — cycle case tabs on dossier pages
- **`Esc`** — close overlay / deselect map case

## APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/monitor` | Monitor payload (cases, pins, news, filters) |
| `GET /api/world-news` | Live + seed news items |
| `GET /api/cases` | Full case catalog JSON |
| `POST /api/ingest` | Structured case ingest (Bearer `CRON_SECRET`) |
| `POST /api/cron/live-update` | RSS ingest + auto-publish (Bearer `CRON_SECRET`) |
| `POST /api/pipeline/publish` | Publish when integrity gates pass |
| `GET /api/pipeline/status` | Queue blockers, recent jobs, LLM availability |

## Architecture

- **Next.js 16** App Router + TypeScript + Tailwind
- **Leaflet** map with marker clustering + self-hosted country GeoJSON
- Local store in `.data/store.json` (seeded from `src/data/seed.ts`, `worldCases.ts`, `multilingualCases.ts`)
- Optional Supabase: apply `supabase/schema.sql`, set `NEXT_PUBLIC_SUPABASE_*`, sync with `npm run db:sync`

## Live updates (secured AI pipeline)

- Cron: `GET/POST /api/cron/live-update` with `Authorization: Bearer CRON_SECRET` (see `vercel.json`)
- Manual ingest: `POST /api/ingest` with the same bearer token
- Flow: RSS → dedupe → AI draft case → narrative + analysis → **auto-publish only if integrity gates pass**
- Cases that fail gates (e.g. missing verifiable reference) stay draft-only and hidden from public browse

## Ethics

See `/about`. Core rules: victim dignity, warnings, no invented diagnoses, copyright-aware sourcing, educational disclaimer, distress resources (988).
