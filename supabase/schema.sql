-- Motive Index — Supabase schema (run in SQL editor)
-- Cases + documents aligned to the research archive model.

create extension if not exists "pgcrypto";

create table if not exists public.cases (
  id text primary key,
  slug text unique not null,
  name text not null,
  subtitle text,
  jurisdiction text,
  location text,
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

-- Storage bucket for primary-source uploads (create in dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('case-documents', 'case-documents', false);

alter table public.cases enable row level security;
alter table public.documents enable row level security;

-- Public read of published educational metadata
create policy "Public read cases"
  on public.cases for select
  using (true);

create policy "Public read documents"
  on public.documents for select
  using (true);

-- Writes require authenticated users (admin)
create policy "Auth insert cases"
  on public.cases for insert
  to authenticated
  with check (true);

create policy "Auth update cases"
  on public.cases for update
  to authenticated
  using (true);

create policy "Auth insert documents"
  on public.documents for insert
  to authenticated
  with check (true);
