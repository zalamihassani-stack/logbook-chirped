-- Enhancements for scientific work tracking.
-- Run this once in Supabase SQL Editor before using structured supervisors/authors.

insert into public.travail_types (name, color_hex, display_order, is_active)
select 'Article', '#0D2B4E', 1, true
where not exists (select 1 from public.travail_types where lower(name) = 'article');

insert into public.travail_types (name, color_hex, display_order, is_active)
select 'Communication orale', '#166534', 2, true
where not exists (select 1 from public.travail_types where lower(name) = 'communication orale');

insert into public.travail_types (name, color_hex, display_order, is_active)
select 'Communication affichée', '#854d0e', 3, true
where not exists (select 1 from public.travail_types where lower(name) in ('communication affichée', 'communication affichee'));

do $$
declare
  status_value text;
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'travail_status'
  ) then
    foreach status_value in array array['en_cours', 'soumis', 'accepte', 'publie', 'presente']
    loop
      execute format('alter type public.travail_status add value if not exists %L', status_value);
    end loop;
  end if;
end $$;

alter table public.travaux_scientifiques
  add column if not exists encadrant_id uuid references public.profiles(id) on delete set null;

alter table public.travaux_scientifiques
  add column if not exists validation_status text not null default 'pending_initial',
  add column if not exists initial_validated_by uuid references public.profiles(id) on delete set null,
  add column if not exists initial_validated_at timestamptz,
  add column if not exists final_validated_by uuid references public.profiles(id) on delete set null,
  add column if not exists final_validated_at timestamptz,
  add column if not exists validation_feedback text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'travaux_scientifiques_validation_status_check'
  ) then
    alter table public.travaux_scientifiques
      add constraint travaux_scientifiques_validation_status_check
      check (validation_status in ('pending_initial', 'initial_validated', 'pending_final', 'final_validated', 'refused'));
  end if;
end $$;

create table if not exists public.travail_auteurs (
  id uuid primary key default gen_random_uuid(),
  travail_id uuid not null references public.travaux_scientifiques(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  external_name text,
  author_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint travail_auteurs_author_check check (
    profile_id is not null or nullif(trim(external_name), '') is not null
  )
);

create index if not exists travail_auteurs_travail_idx on public.travail_auteurs(travail_id, author_order);
create index if not exists travail_auteurs_profile_idx on public.travail_auteurs(profile_id);
create index if not exists travaux_scientifiques_encadrant_idx on public.travaux_scientifiques(encadrant_id);
create index if not exists travaux_scientifiques_validation_status_idx on public.travaux_scientifiques(validation_status);

alter table public.notifications
  add column if not exists travail_id uuid references public.travaux_scientifiques(id) on delete cascade;

create index if not exists notifications_travail_idx
  on public.notifications(travail_id);

update public.travaux_scientifiques
set validation_status = 'pending_final',
    validation_feedback = null
where validation_status = 'initial_validated'
  and status::text in ('publie', 'presente');

create table if not exists public.travail_validation_history (
  id uuid primary key default gen_random_uuid(),
  travail_id uuid not null references public.travaux_scientifiques(id) on delete cascade,
  enseignant_id uuid references public.profiles(id) on delete set null,
  action text not null,
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists travail_validation_history_travail_idx
  on public.travail_validation_history(travail_id, created_at desc);

alter table public.travail_validation_history enable row level security;

drop policy if exists "travail validation history readable by authenticated users" on public.travail_validation_history;
create policy "travail validation history readable by authenticated users"
  on public.travail_validation_history for select
  to authenticated
  using (true);

drop policy if exists "travail validation history insertable by teachers and admins" on public.travail_validation_history;
create policy "travail validation history insertable by teachers and admins"
  on public.travail_validation_history for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
    or exists (
      select 1
      from public.travaux_scientifiques ts
      join public.profiles p on p.id = auth.uid()
      where ts.id = travail_id
        and ts.encadrant_id = auth.uid()
        and p.role = 'enseignant'
    )
  );

alter table public.travail_auteurs enable row level security;

drop policy if exists "travail auteurs readable by authenticated users" on public.travail_auteurs;
create policy "travail auteurs readable by authenticated users"
  on public.travail_auteurs for select
  to authenticated
  using (true);

drop policy if exists "travail auteurs insertable by residents and admins" on public.travail_auteurs;
create policy "travail auteurs insertable by residents and admins"
  on public.travail_auteurs for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.travaux_scientifiques ts
      where ts.id = travail_id
        and ts.resident_id = auth.uid()
    )
    or exists (
      select 1
      from public.travaux_scientifiques ts
      join public.profiles p on p.id = auth.uid()
      where ts.id = travail_id
        and (
          p.role = 'admin'
          or (p.role = 'enseignant' and ts.encadrant_id = auth.uid())
        )
    )
  );

drop policy if exists "travail auteurs updatable by owner and staff" on public.travail_auteurs;
create policy "travail auteurs updatable by owner and staff"
  on public.travail_auteurs for all
  to authenticated
  using (
    exists (
      select 1
      from public.travaux_scientifiques ts
      where ts.id = travail_id
        and ts.resident_id = auth.uid()
    )
    or exists (
      select 1
      from public.travaux_scientifiques ts
      join public.profiles p on p.id = auth.uid()
      where ts.id = travail_id
        and (
          p.role = 'admin'
          or (p.role = 'enseignant' and ts.encadrant_id = auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.travaux_scientifiques ts
      where ts.id = travail_id
        and ts.resident_id = auth.uid()
    )
    or exists (
      select 1
      from public.travaux_scientifiques ts
      join public.profiles p on p.id = auth.uid()
      where ts.id = travail_id
        and (
          p.role = 'admin'
          or (p.role = 'enseignant' and ts.encadrant_id = auth.uid())
        )
    )
  );

-- Ask Supabase/PostgREST to reload the schema cache after the migration.
select pg_notify('pgrst', 'reload schema');
