-- Formation objectives for the surgical logbook.
-- Run this once in Supabase SQL Editor, then review and clean the imported rows.

create table if not exists public.formation_objectives (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  year integer not null check (year between 1 and 5),
  required_level integer not null check (required_level between 1 and 3),
  min_count integer not null default 1 check (min_count > 0),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (procedure_id, year, required_level)
);

create index if not exists formation_objectives_year_idx on public.formation_objectives(year);
create index if not exists formation_objectives_procedure_idx on public.formation_objectives(procedure_id);
create index if not exists formation_objectives_active_idx on public.formation_objectives(is_active);

-- Optional backfill from the previous table.
-- Keep this commented for your current case, because the old table contains the incorrect
-- "130 objectives per year" dataset. Use the admin UI or an import CSV to create the curated
-- A1-A5 objectives instead.
--
-- insert into public.formation_objectives (procedure_id, year, required_level, min_count)
-- select procedure_id, year, required_level, coalesce(min_count, 1)
-- from public.procedure_objectives
-- where required_level between 1 and 3
-- on conflict (procedure_id, year, required_level) do update
-- set min_count = excluded.min_count,
--     is_active = true;

alter table public.formation_objectives enable row level security;

-- These policies assume access is gated by the application server and existing profile roles.
-- Adjust if your project already has stricter RLS helper functions.
drop policy if exists "formation objectives readable by authenticated users" on public.formation_objectives;
create policy "formation objectives readable by authenticated users"
  on public.formation_objectives for select
  to authenticated
  using (true);

drop policy if exists "formation objectives writable by admins" on public.formation_objectives;
create policy "formation objectives writable by admins"
  on public.formation_objectives for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );