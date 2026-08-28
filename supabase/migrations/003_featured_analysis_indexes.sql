-- Migration 003: indexes for featured dossiers and published analysis filtering

create index if not exists cases_featured_idx
  on public.cases ((payload @> '{"featured": true}'::jsonb));

create index if not exists cases_analysis_published_idx
  on public.cases ((payload @> '{"analysis": {"status": "published"}}'::jsonb));
