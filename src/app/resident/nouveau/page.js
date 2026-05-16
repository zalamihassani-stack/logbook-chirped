import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import NouveauForm from './NouveauForm'
import { getResidentYear } from '@/lib/utils'
import { getResidentProgressRows, indexProgressByProcedure, procedureToGlobalObjective } from '@/lib/logbook'
import { getAppSettings } from '@/lib/app-settings'

export default async function NouveauPage({ searchParams }) {
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
  const params = await searchParams
  const initialProcedureId = typeof params?.procedure === 'string' ? params.procedure : ''

  const [{ data: procedures }, { data: enseignants }, { data: residents }, settingsRes, progressRows] = await Promise.all([
    supabase
      .from('procedures')
      .select('id, name, pathologie, objectif_final, target_level, target_count, target_year, seuil_exposition_min, seuil_supervision_min, seuil_autonomie_min, seuil_deblocage_autonomie, category_id, categories(name, color_hex)')
      .eq('is_active', true)
      .order('name'),
    admin.from('profiles').select('id, full_name').eq('role', 'enseignant').eq('is_active', true).order('full_name'),
    admin.from('profiles').select('id, full_name').eq('role', 'resident').eq('is_active', true).neq('id', user.id).order('full_name'),
    getAppSettings(supabase, 'allow_hors_objectifs, compte_rendu_required'),
    getResidentProgressRows(supabase, user.id),
  ])

  const proceduresWithTag = (procedures ?? []).map((procedure) => ({
    ...procedure,
    objective: procedureToGlobalObjective(procedure),
  })).map((procedure) => ({
    ...procedure,
    isObjectif: procedure.objective?.year <= year,
  }))

  return (
    <div className="max-w-3xl p-5 md:p-8">
      <NouveauForm
        procedures={proceduresWithTag}
        enseignants={enseignants ?? []}
        residents={residents ?? []}
        residentYear={year}
        progressByProcedure={indexProgressByProcedure(progressRows)}
        settings={settingsRes.settings}
        initialProcedureId={initialProcedureId}
      />
    </div>
  )
}
