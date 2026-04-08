-- ============================================================
-- NGP TypeForm — Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- ── Forms ──────────────────────────────────────────────────

create table if not exists forms (
  id           text primary key,
  title        text not null default '',
  description  text not null default '',
  fields       jsonb not null default '[]',
  theme        jsonb not null default '{}',
  settings     jsonb not null default '{}',
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table forms enable row level security;

create policy "forms_allow_all_anon"
  on forms for all
  to anon
  using (true)
  with check (true);

-- ── Responses ──────────────────────────────────────────────

create table if not exists responses (
  id           text primary key,
  form_id      text not null references forms(id) on delete cascade,
  answers      jsonb not null default '{}',
  submitted_at timestamptz not null default now()
);

alter table responses enable row level security;

create policy "responses_allow_all_anon"
  on responses for all
  to anon
  using (true)
  with check (true);

-- ── Sessions ───────────────────────────────────────────────

create table if not exists sessions (
  id            text primary key,
  form_id       text not null references forms(id) on delete cascade,
  status        text not null default 'in_progress',
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  total_time_ms integer,
  last_field_id text,
  steps         jsonb not null default '[]'
);

alter table sessions enable row level security;

create policy "sessions_allow_all_anon"
  on sessions for all
  to anon
  using (true)
  with check (true);

-- ── Indexes ────────────────────────────────────────────────

create index if not exists responses_form_id_idx on responses(form_id);
create index if not exists sessions_form_id_idx  on sessions(form_id);
