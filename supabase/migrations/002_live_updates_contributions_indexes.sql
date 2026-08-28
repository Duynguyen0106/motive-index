-- Motive Index migration 002
-- live_updates, contributions, ingest dedup, and query indexes

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
