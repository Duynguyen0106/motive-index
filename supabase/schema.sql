-- Motive Index — run once in Supabase SQL Editor
-- Project: sccrvdqrllsgnxctyrhr

create extension if not exists "pgcrypto";

create table if not exists public.cases (
  id text primary key,
  slug text unique not null,
  name text not null,
  subtitle text,
  jurisdiction text,
  location text,
  country text,
  year_start int,
  year_end int,
  status text check (status in ('closed', 'unsolved', 'historical')),
  crime_categories text[] default '{}',
  overview text,
  warning text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id text primary key,
  case_id text references public.cases (id) on delete cascade,
  case_slug text,
  title text not null,
  type text not null,
  date text,
  author text,
  source text,
  public_domain boolean default false,
  summary text,
  psych_relevance text,
  content_warning text,
  storage_path text,
  url text,
  hosted boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists documents_case_id_idx on public.documents (case_id);
create index if not exists cases_crime_categories_idx on public.cases using gin (crime_categories);

alter table public.cases enable row level security;
alter table public.documents enable row level security;

drop policy if exists "Public read cases" on public.cases;
create policy "Public read cases"
  on public.cases for select
  using (true);

drop policy if exists "Public read documents" on public.documents;
create policy "Public read documents"
  on public.documents for select
  using (true);

drop policy if exists "Auth insert cases" on public.cases;
create policy "Auth insert cases"
  on public.cases for insert
  to authenticated
  with check (true);

drop policy if exists "Auth update cases" on public.cases;
create policy "Auth update cases"
  on public.cases for update
  to authenticated
  using (true);

drop policy if exists "Auth insert documents" on public.documents;
create policy "Auth insert documents"
  on public.documents for insert
  to authenticated
  with check (true);

drop policy if exists "Auth update documents" on public.documents;
create policy "Auth update documents"
  on public.documents for update
  to authenticated
  using (true);

-- Storage bucket for admin uploads
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

drop policy if exists "Auth read case documents" on storage.objects;
create policy "Auth read case documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'case-documents');

drop policy if exists "Auth upload case documents" on storage.objects;
create policy "Auth upload case documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'case-documents');

create or replace view public.cases_awaiting_moderation as
select *
from public.cases
where coalesce(payload->'analysis'->>'status', '') in ('draft', 'pending')
   or payload->'tags' ? 'awaiting-moderation';

-- ── Migration 002: live feed, contributions, ingest dedup, indexes ──

create table if not exists public.live_updates (
  id text primary key,
  created_at timestamptz not null default now(),
  headline text not null,
  summary text,
  case_slug text,
  kind text not null check (
    kind in ('new_case', 'analysis_ready', 'source_added', 'revision', 'world_news')
  ),
  status text not null default 'published' check (status in ('published', 'draft')),
  country text,
  region text,
  source_url text,
  source_name text,
  language text,
  language_label text,
  original_headline text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists live_updates_created_at_idx on public.live_updates (created_at desc);
create index if not exists live_updates_case_slug_idx on public.live_updates (case_slug);
create index if not exists live_updates_kind_idx on public.live_updates (kind);

create table if not exists public.contributions (
  id text primary key,
  kind text not null check (kind in ('case', 'analysis', 'document')),
  title text not null,
  submitter_name text not null,
  submitter_role text not null,
  summary text not null,
  status text not null default 'pending' check (
    status in ('pending', 'in_review', 'accepted', 'rejected')
  ),
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists contributions_status_idx on public.contributions (status);
create index if not exists contributions_created_at_idx on public.contributions (created_at desc);

create table if not exists public.ingest_headlines (
  normalized_title text primary key,
  first_seen_at timestamptz not null default now(),
  source text,
  case_slug text
);

create index if not exists cases_country_idx on public.cases (country);
create index if not exists cases_status_idx on public.cases (status);
create index if not exists cases_slug_idx on public.cases (slug);
create index if not exists cases_year_start_idx on public.cases (year_start);
create index if not exists cases_payload_gin_idx on public.cases using gin (payload jsonb_path_ops);
create index if not exists cases_search_idx on public.cases using gin (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(overview, ''))
);

create or replace function public.set_cases_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
  before update on public.cases
  for each row execute function public.set_cases_updated_at();

alter table public.live_updates enable row level security;
alter table public.contributions enable row level security;
alter table public.ingest_headlines enable row level security;

drop policy if exists "Public read live_updates" on public.live_updates;
create policy "Public read live_updates"
  on public.live_updates for select using (true);

drop policy if exists "Auth write live_updates" on public.live_updates;
create policy "Auth write live_updates"
  on public.live_updates for insert to authenticated with check (true);

drop policy if exists "Auth update live_updates" on public.live_updates;
create policy "Auth update live_updates"
  on public.live_updates for update to authenticated using (true);

drop policy if exists "Public read contributions" on public.contributions;
create policy "Public read contributions"
  on public.contributions for select using (true);

drop policy if exists "Auth insert contributions" on public.contributions;
create policy "Auth insert contributions"
  on public.contributions for insert to authenticated with check (true);

drop policy if exists "Auth update contributions" on public.contributions;
create policy "Auth update contributions"
  on public.contributions for update to authenticated using (true);

drop policy if exists "Service ingest headlines" on public.ingest_headlines;
create policy "Service ingest headlines"
  on public.ingest_headlines for all to authenticated using (true) with check (true);

create or replace view public.cases_published as
select *
from public.cases
where coalesce(payload->'analysis'->>'status', '') = 'published';

-- Migration 003: featured + published analysis indexes
create index if not exists cases_featured_idx
  on public.cases ((payload @> '{"featured": true}'::jsonb));

create index if not exists cases_analysis_published_idx
  on public.cases ((payload @> '{"analysis": {"status": "published"}}'::jsonb));
