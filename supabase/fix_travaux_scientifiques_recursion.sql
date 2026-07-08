-- Fixes "infinite recursion detected in policy for relation travaux_scientifiques".
-- Cause: travaux_scientifiques_select_secure queries travail_auteurs (RLS-protected),
-- while travail_auteurs_select_secure (and its insert/update policies) query
-- travaux_scientifiques back (RLS-protected) -> cycle.
-- Fix: replace the cross-table EXISTS checks with security definer helper functions
-- that bypass RLS for this specific lookup, breaking the cycle.
-- Run this once in the Supabase SQL Editor.

create or replace function public.is_travail_resident(p_travail_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from travaux_scientifiques
    where id = p_travail_id
      and resident_id = p_user_id
  );
$$;

create or replace function public.is_travail_author(p_travail_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from travail_auteurs
    where travail_id = p_travail_id
      and profile_id = p_user_id
  );
$$;

-- travaux_scientifiques: stop querying travail_auteurs directly, use the helper instead.
drop policy if exists "travaux_select_secure" on public.travaux_scientifiques;
create policy "travaux_select_secure"
  on public.travaux_scientifiques
  for select
  using (
    get_my_role() = ANY (ARRAY['enseignant'::user_role, 'admin'::user_role])
    or resident_id = auth.uid()
    or public.is_travail_author(id, auth.uid())
  );

-- travail_auteurs: stop querying travaux_scientifiques directly, use the helper instead.
drop policy if exists "travail_auteurs_select_secure" on public.travail_auteurs;
create policy "travail_auteurs_select_secure"
  on public.travail_auteurs
  for select
  using (
    get_my_role() = ANY (ARRAY['enseignant'::user_role, 'admin'::user_role])
    or profile_id = auth.uid()
    or public.is_travail_resident(travail_id, auth.uid())
  );

drop policy if exists "travail auteurs insertable by residents and admins" on public.travail_auteurs;
create policy "travail auteurs insertable by residents and admins"
  on public.travail_auteurs
  for insert
  to authenticated
  with check (
    public.is_travail_resident(travail_id, auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = ANY (ARRAY['admin'::user_role, 'enseignant'::user_role])
    )
  );

drop policy if exists "travail auteurs updatable by owner and staff" on public.travail_auteurs;
create policy "travail auteurs updatable by owner and staff"
  on public.travail_auteurs
  for all
  to authenticated
  using (
    public.is_travail_resident(travail_id, auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = ANY (ARRAY['admin'::user_role, 'enseignant'::user_role])
    )
  )
  with check (
    public.is_travail_resident(travail_id, auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = ANY (ARRAY['admin'::user_role, 'enseignant'::user_role])
    )
  );

select pg_notify('pgrst', 'reload schema');
