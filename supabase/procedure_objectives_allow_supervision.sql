-- Autorise les objectifs annuels de supervision dans procedure_objectives.
-- A executer dans Supabase SQL Editor avant d'inserer des required_level = 2.

alter table public.procedure_objectives
drop constraint if exists procedure_objectives_autonomy_only_check;

alter table public.procedure_objectives
drop constraint if exists procedure_objectives_required_level_check;

alter table public.procedure_objectives
add constraint procedure_objectives_required_level_check
check (required_level in (2, 3));

-- Optionnel: verifier les contraintes presentes sur la table.
select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.procedure_objectives'::regclass
order by conname;
