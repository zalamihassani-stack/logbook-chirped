-- Audit rapide des objectifs du logbook.
-- A executer dans Supabase SQL Editor pour verifier la coherence procedures / procedure_objectives.

-- 1) Repartition des gestes par objectif final.
select
  objectif_final,
  case objectif_final
    when 1 then 'Exposition'
    when 2 then 'Sous supervision'
    when 3 then 'Autonomie'
    else 'Inconnu'
  end as objectif_label,
  count(*) as procedures_count
from public.procedures
where is_active = true
group by objectif_final
order by objectif_final;

-- 2) Repartition des objectifs annuels réellement saisis.
select
  required_level,
  case required_level
    when 1 then 'Exposition - ne devrait plus etre utilise ici'
    when 2 then 'Sous supervision'
    when 3 then 'Autonomie'
    else 'Inconnu'
  end as required_label,
  year,
  count(*) as objectives_count
from public.procedure_objectives
where is_active = true
group by required_level, year
order by required_level, year;

-- 3) Gestes dont l'objectif final est supervision, mais sans objectif annuel de supervision.
select
  p.id,
  p.name,
  p.pathologie,
  p.objectif_final,
  p.seuil_supervision_min
from public.procedures p
where p.is_active = true
  and p.objectif_final = 2
  and not exists (
    select 1
    from public.procedure_objectives po
    where po.procedure_id = p.id
      and po.required_level = 2
      and po.is_active = true
  )
order by p.name;

-- 4) Gestes dont l'objectif final est autonomie, mais sans objectif annuel d'autonomie.
select
  p.id,
  p.name,
  p.pathologie,
  p.objectif_final,
  p.seuil_autonomie_min
from public.procedures p
where p.is_active = true
  and p.objectif_final = 3
  and not exists (
    select 1
    from public.procedure_objectives po
    where po.procedure_id = p.id
      and po.required_level = 3
      and po.is_active = true
  )
order by p.name;

-- 5) Lignes d'exposition encore presentes dans procedure_objectives.
-- Avec la nouvelle logique, l'exposition est derivee de procedures.objectif_final = 1.
select
  po.id,
  po.procedure_id,
  p.name,
  po.year,
  po.required_level,
  po.min_count
from public.procedure_objectives po
join public.procedures p on p.id = po.procedure_id
where po.is_active = true
  and po.required_level = 1
order by po.year, p.name;
