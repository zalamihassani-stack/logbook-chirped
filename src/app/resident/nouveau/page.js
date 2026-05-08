import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import NouveauForm from './NouveauForm'
import { getResidentYear } from '@/lib/utils'

export default async function NouveauPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('residanat_start_date')
    .eq('id', user.id)
    .single()
  const year = getResidentYear(profile?.residanat_start_date)

  const [{ data: procedures }, { data: enseignants }, { data: residents }, { data: objectives }] = await Promise.all([
    supabase
      .from('procedures')
      .select('id, name, pathologie, objectif_final, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie, category_id, categories(name, color_hex)')
      .eq('is_active', true)
      .order('name'),
    admin.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true).neq('id', user.id).order('full_name'),
    supabase.from('procedure_objectives').select('procedure_id, required_level, min_count').eq('year', year).eq('is_active', true),
  ])

  const objectivesByProcedure = new Map((objectives ?? []).map((objective) => [objective.procedure_id, objective]))

  const proceduresWithTag = (procedures ?? []).map((procedure) => ({
    ...procedure,
    objective: objectivesByProcedure.get(procedure.id) ?? null,
    isObjectif: objectivesByProcedure.has(procedure.id),
  }))

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <NouveauForm
        procedures={proceduresWithTag}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
        residentYear={year}
      />
    </div>
  )
}
