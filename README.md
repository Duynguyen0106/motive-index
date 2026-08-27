# Motive Index

Educational research archive for **historical crime case files** and **forensic psychological analysis**.

Built for students, academics, researchers, training contexts, and scholarly public readers—with content warnings, citation discipline, and an explicitly non-sensational academic design.

## Product scope (this codebase)

| Area | Status in MVP |
|------|----------------|
| Structured case database | ✅ metadata + dossiers |
| Advanced search & filters | ✅ `/search` |
| Psychological analysis + commentary | ✅ constructs + expert/student notes |
| Document library | ✅ tagged pointers / link-outs |
| Contributions & moderation queue | ✅ form + `/api/contribute` |
| Educational resources | ✅ glossary, theories, case of the week |
| Ethics / about | ✅ `/about` |
| Auth, Postgres, Elasticsearch | 🔜 next production phase |
| Age-gated restricted docs | 🔜 policy stubbed |

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional LLM analysis drafts:

```bash
cp .env.example .env.local
# set OPENAI_API_KEY
```

## Primary routes

- `/` — home, live ticker, case of the week
- `/cases` — browse dossiers
- `/cases/[slug]?tab=` — Overview · Timeline · Analysis · Documents · References
- `/search` — filters for crime type, psych factors, theories, period, docs, etc.
- `/documents` — document library
- `/analyses` — commentary index
- `/resources` — glossary + theories
- `/contribute` — submission + moderation queue
- `/about` — purpose, ethics, access policy
- `/method` — scoring rubric
- `/live` — ingest/update feed

## Architecture notes

- Next.js App Router + TypeScript + Tailwind
- In-memory store seeded from `src/data/seed.ts` + `src/data/catalog.ts`
- Swap store for **PostgreSQL** (cases, people, documents, tags) and add full-text search when moving to production
- Documents are mostly **citations / link-outs**; only mark `publicDomain` + `hosted` when legally clear

## Ethics

See `/about`. Core rules: victim dignity, warnings, no invented diagnoses, copyright-aware sourcing, educational disclaimer, distress resources.
