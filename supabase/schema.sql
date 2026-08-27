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
