-- Ajoute la notion de service pour separer les gestes et les enseignants.
-- Services reels:
-- - viscerale_urologie: Viscérale et urologie pediatrique
-- - traumato_orthopedie: Traumatologie et orthopedie pediatrique
--
-- A executer dans l'editeur SQL Supabase avant d'utiliser les champs dans l'application.

alter table public.profiles
  add column if not exists service text;

alter table public.procedures
  add column if not exists service text;

alter table public.profiles
  drop constraint if exists profiles_service_check;

alter table public.procedures
  drop constraint if exists procedures_service_check;

update public.profiles
set service = 'viscerale_urologie'
where role = 'enseignant'
  and (service is null or service in ('viscerale', 'urologie'));

update public.profiles
set service = 'traumato_orthopedie'
where role = 'enseignant'
  and service = 'traumatologie';

update public.procedures
set service = 'viscerale_urologie'
where service is null
  or service in ('viscerale', 'urologie');

update public.procedures
set service = 'traumato_orthopedie'
where service = 'traumatologie';

insert into public.categories (name, color_hex, display_order)
select 'Traumatologie et orthopedie pediatrique', '#b45309', 50
where not exists (
  select 1
  from public.categories
  where lower(name) in (
    'traumatologie',
    'traumatologie et orthopedie pediatrique'
  )
);

alter table public.profiles
  add constraint profiles_service_check
  check (
    service is null
    or service in ('viscerale_urologie', 'traumato_orthopedie')
  );

alter table public.procedures
  alter column service set default 'viscerale_urologie';

alter table public.procedures
  alter column service set not null;

alter table public.procedures
  add constraint procedures_service_check
  check (service in ('viscerale_urologie', 'traumato_orthopedie'));

create index if not exists profiles_service_idx on public.profiles(service);
create index if not exists procedures_service_idx on public.procedures(service);
