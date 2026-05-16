-- Migration additive vers le modele simplifie des objectifs.
-- A executer dans Supabase SQL Editor.
--
-- Objectif:
-- - garder l'ancien modele intact pendant la transition;
-- - ajouter un objectif unique par geste:
--   target_level: 1 exposition, 2 sous supervision, 3 maitrise/autonomie
--   target_count: nombre requis pour valider l'objectif
--   target_year: annee cible A1-A5

begin;

alter table public.procedures
  add column if not exists target_level integer,
  add column if not exists target_count integer,
  add column if not exists target_year integer;

comment on column public.procedures.target_level is
  'Niveau objectif simplifie: 1 exposition, 2 sous supervision, 3 maitrise/autonomie.';

comment on column public.procedures.target_count is
  'Nombre de realisations compatibles requis pour atteindre l''objectif.';

comment on column public.procedures.target_year is
  'Annee cible de l''objectif, de 1 a 5.';

-- 1) Initialisation depuis le niveau final historique et les seuils existants.
update public.procedures
set
  target_level = coalesce(target_level, objectif_final),
  target_count = coalesce(
    target_count,
    case objectif_final
      when 1 then nullif(seuil_exposition_min, 0)
      when 2 then nullif(seuil_supervision_min, 0)
      when 3 then nullif(seuil_autonomie_min, 0)
      else null
    end,
    1
  ),
  target_year = coalesce(target_year, 1)
where is_active = true;

-- 2) Recuperation de l'annee cible depuis procedure_objectives quand elle existe
-- pour le meme niveau que target_level.
with ranked_objectives as (
  select
    po.procedure_id,
    po.required_level,
    po.year,
    po.min_count,
    row_number() over (
      partition by po.procedure_id, po.required_level
      order by po.year asc, po.created_at asc
    ) as rn
  from public.procedure_objectives po
  where po.is_active = true
    and po.required_level in (2, 3)
)
update public.procedures p
set
  target_year = ro.year,
  target_count = coalesce(nullif(ro.min_count, 0), p.target_count, 1)
from ranked_objectives ro
where ro.procedure_id = p.id
  and ro.required_level = p.target_level
  and ro.rn = 1
  and p.is_active = true;

-- 3) Normalisation defensive.
update public.procedures
set
  target_level = case
    when target_level in (1, 2, 3) then target_level
    when objectif_final in (1, 2, 3) then objectif_final
    else 1
  end,
  target_count = greatest(coalesce(target_count, 1), 1),
  target_year = least(greatest(coalesce(target_year, 1), 1), 5)
where is_active = true;

-- 4) Contraintes simples, sans toucher aux anciennes colonnes.
alter table public.procedures
  drop constraint if exists procedures_target_level_check;

alter table public.procedures
  add constraint procedures_target_level_check
  check (target_level is null or target_level in (1, 2, 3));

alter table public.procedures
  drop constraint if exists procedures_target_count_check;

alter table public.procedures
  add constraint procedures_target_count_check
  check (target_count is null or target_count >= 1);

alter table public.procedures
  drop constraint if exists procedures_target_year_check;

alter table public.procedures
  add constraint procedures_target_year_check
  check (target_year is null or target_year between 1 and 5);

commit;

-- Audit post-migration.
select
  target_level,
  case target_level
    when 1 then 'Exposition'
    when 2 then 'Sous supervision'
    when 3 then 'Maitrise / autonomie'
    else 'Non configure'
  end as target_label,
  target_year,
  count(*) as procedures_count
from public.procedures
where is_active = true
group by target_level, target_year
order by target_level, target_year;

-- Gestes actifs qui resteraient incomplets.
select
  id,
  name,
  objectif_final,
  target_level,
  target_count,
  target_year
from public.procedures
where is_active = true
  and (
    target_level is null
    or target_count is null
    or target_year is null
  )
order by name;
