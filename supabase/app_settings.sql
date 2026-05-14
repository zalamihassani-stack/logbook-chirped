create table if not exists public.app_settings (
  id integer primary key default 1,
  push_notifications boolean not null default false,
  validation_required boolean not null default true,
  allow_hors_objectifs boolean not null default true,
  compte_rendu_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (
  id,
  push_notifications,
  validation_required,
  allow_hors_objectifs,
  compte_rendu_required
)
values (1, false, true, true, false)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Authenticated users can read app settings" on public.app_settings;
create policy "Authenticated users can read app settings"
on public.app_settings for select
to authenticated
using (true);

drop policy if exists "Admins can manage app settings" on public.app_settings;
create policy "Admins can manage app settings"
on public.app_settings for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create or replace function public.set_app_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_app_settings_updated_at();
