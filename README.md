# Motive Index

Live-updated educational archive for **forensic psychological analysis** of famous crime cases.

Behavior-first dossiers with evidence, counter-evidence, confidence scores, competing explanations, and explicit unknowns—not sensational true-crime content.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Zod-validated forensic analysis rubric
- In-memory store seeded with curated cases (swap for Postgres later)
- Optional OpenAI analysis when `OPENAI_API_KEY` is set; otherwise deterministic draft analyzer

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Purpose |
|------|---------|
| `/` | Brand hero + live ticker + featured dossiers |
| `/cases` | Full archive |
| `/cases/[slug]` | Timeline, psych map, sources |
| `/live` | Polling live feed |
| `/method` | Rubric & pipeline |
| `GET /api/cases` | Case index JSON |
| `GET /api/updates` | Live updates JSON |
| `POST /api/ingest` | Create a draft case stub from a public headline |
| `POST /api/analyze` | Regenerate analysis draft for a case slug |

### Ingest example

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H 'content-type: application/json' \
  -d '{"headline":"Example arrest cluster","summary":"Public reporting describes an arrest with contested motive statements.","jurisdiction":"Example"}'
```

### Analyze example

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"slug":"ted-bundy"}'
```

## Ethics

- Public sources only
- No clinical certainty about living persons
- No instructional crime detail
- Victim dignity over spectacle
- Draft vs human-reviewed labels are visible on every dossier

## Next production steps

1. Postgres + persistent job queue for ingest
2. News/RSS connectors with dedupe
3. Human review admin UI
4. Embedding search across constructs
5. Evaluation set scored by domain reviewers
